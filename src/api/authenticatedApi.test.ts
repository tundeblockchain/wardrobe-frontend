import { describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_DELETE_TIMEOUT_MS,
  createAuthenticatedApi,
} from "./authenticatedApi";
import { isApiError } from "./httpClient";

const API_BASE_URL = "https://api.example.com";

const meBody = {
  userId: "user-1",
  tier: "PREMIUM",
  status: "ACTIVE",
  features: {
    unlimitedCatalog: true,
    aiTryOn: true,
    otherAi: true,
  },
  limits: null,
  usage: {
    wardrobes: 2,
    items: 5,
    outfits: 1,
  },
  store: "STRIPE",
  updatedAt: "2026-10-01T09:12:00.000Z",
};

const createJsonResponse = ({
  status,
  body,
}: {
  status: number;
  body?: unknown;
}) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: async () => body,
  };
};

const createApi = ({
  token = "id-token",
  refreshedToken = "refreshed-token",
  fetchImpl,
}: {
  token?: string | null;
  refreshedToken?: string | null;
  fetchImpl: typeof fetch;
}) => {
  const getIdToken = vi.fn(async (forceRefresh = false) => {
    return forceRefresh ? refreshedToken : token;
  });
  const signOut = vi.fn().mockResolvedValue(undefined);
  const navigate = vi.fn();
  const api = createAuthenticatedApi(
    { getIdToken, signOut },
    {
      navigate,
      fetchImpl,
      baseUrl: API_BASE_URL,
    },
  );

  return { api, getIdToken, signOut, navigate };
};

const readAuthorization = (init: RequestInit | undefined): string | undefined => {
  const headers = init?.headers;
  if (!headers || typeof headers !== "object" || Array.isArray(headers)) {
    return undefined;
  }

  return (headers as Record<string, string>).Authorization;
};

describe("createAuthenticatedApi", () => {
  it("attaches a Bearer Firebase ID token", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({ status: 200, body: meBody }),
    );
    const { api, getIdToken, signOut } = createApi({
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(api.getMe()).resolves.toEqual(meBody);
    expect(getIdToken).toHaveBeenCalledTimes(1);
    expect(getIdToken).toHaveBeenCalledWith(false);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, options] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/me");
    expect(options.method).toBe("GET");
    expect(readAuthorization(options)).toBe("Bearer id-token");
    expect(signOut).not.toHaveBeenCalled();
  });

  it("deletes the account with DELETE /me and does not sign out on success", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({ status: 200, body: { deleted: true } }),
    );
    const { api, getIdToken, signOut } = createApi({
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(api.deleteAccount()).resolves.toEqual({ deleted: true });
    expect(getIdToken).toHaveBeenCalledTimes(1);
    const [url, options] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/me");
    expect(options.method).toBe("DELETE");
    expect(readAuthorization(options)).toBe("Bearer id-token");
    expect(signOut).not.toHaveBeenCalled();
    expect(ACCOUNT_DELETE_TIMEOUT_MS).toBe(60_000);
  });

  it("clears content with DELETE /me/content", async () => {
    const wipeBody = {
      keepAccount: true,
      deletedWardrobes: 1,
      deletedItems: 2,
      deletedOutfits: 0,
      deletedAiProfiles: 0,
      deletedS3Objects: 2,
      s3Failures: 0,
    };
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({ status: 200, body: wipeBody }),
    );
    const { api, signOut } = createApi({
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(api.clearContent()).resolves.toEqual(wipeBody);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://api.example.com/me/content",
    );
    expect((fetchImpl.mock.calls[0]?.[1] as RequestInit).method).toBe("DELETE");
    expect(signOut).not.toHaveBeenCalled();
  });

  it("does not sign out when DELETE /me fails with a non-401 error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 500,
        body: {
          error: {
            code: "ACCOUNT_DELETION_FAILED",
            message: "Account data deletion failed.",
          },
        },
      }),
    );
    const { api, signOut, navigate } = createApi({
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(api.deleteAccount()).rejects.toMatchObject({
      status: 500,
      code: "ACCOUNT_DELETION_FAILED",
    });
    expect(signOut).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("force-refreshes the token and retries once on 401", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          status: 401,
          body: { error: { code: "UNAUTHENTICATED", message: "Expired" } },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({ status: 200, body: meBody }),
      );
    const { api, getIdToken, signOut, navigate } = createApi({
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(api.getMe()).resolves.toEqual(meBody);
    expect(getIdToken).toHaveBeenNthCalledWith(1, false);
    expect(getIdToken).toHaveBeenNthCalledWith(2, true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(readAuthorization(fetchImpl.mock.calls[0]?.[1] as RequestInit)).toBe(
      "Bearer id-token",
    );
    expect(readAuthorization(fetchImpl.mock.calls[1]?.[1] as RequestInit)).toBe(
      "Bearer refreshed-token",
    );
    expect(signOut).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("signs out and redirects to /login when a 401 persists after refresh", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 401,
        body: { error: { code: "UNAUTHENTICATED", message: "Invalid" } },
      }),
    );
    const { api, getIdToken, signOut, navigate } = createApi({
      fetchImpl: fetchImpl as typeof fetch,
    });

    const error = await api.getMe().catch((caught: unknown) => caught);
    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({ status: 401 });
    expect(getIdToken).toHaveBeenCalledTimes(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/login");
  });

  it("does not retry non-401 failures", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 500,
        body: { error: { code: "INTERNAL", message: "Server error" } },
      }),
    );
    const { api, getIdToken, signOut, navigate } = createApi({
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(api.getMe()).rejects.toMatchObject({
      status: 500,
      code: "INTERNAL",
    });
    expect(getIdToken).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(signOut).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
