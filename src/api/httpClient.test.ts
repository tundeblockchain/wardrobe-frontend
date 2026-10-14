import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, isApiError, joinApiUrl, request } from "./httpClient";

const API_BASE_URL = "https://api.example.com";

const createJsonResponse = ({
  status,
  body,
  headers,
}: {
  status: number;
  body?: unknown;
  headers?: Headers;
}) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: headers ?? new Headers(),
    json: async () => body,
  };
};

describe("joinApiUrl", () => {
  it("joins a base origin and path without duplicating slashes", () => {
    expect(joinApiUrl("https://api.example.com", "/me")).toBe(
      "https://api.example.com/me",
    );
    expect(joinApiUrl("https://api.example.com/", "me")).toBe(
      "https://api.example.com/me",
    );
    expect(joinApiUrl("https://api.example.com/", "/me")).toBe(
      "https://api.example.com/me",
    );
    expect(joinApiUrl("https://api.example.com", "me")).toBe(
      "https://api.example.com/me",
    );
  });

  it("preserves a base path prefix", () => {
    expect(joinApiUrl("https://api.example.com/v1", "/me")).toBe(
      "https://api.example.com/v1/me",
    );
  });

  it("returns an absolute path unchanged", () => {
    expect(
      joinApiUrl("https://api.example.com", "https://other.example.com/me"),
    ).toBe("https://other.example.com/me");
  });
});

describe("request", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends JSON and returns a parsed JSON body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 200,
        body: { uid: "user-1" },
      }),
    );

    await expect(
      request("/me", {
        baseUrl: API_BASE_URL,
        method: "POST",
        body: { ping: true },
        fetchImpl,
      }),
    ).resolves.toEqual({ uid: "user-1" });

    const [url, options] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/me");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(options.body))).toEqual({ ping: true });
  });

  it("maps a backend error payload onto ApiError including source", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 409,
        body: {
          error: {
            code: "ALREADY_SUBSCRIBED",
            message: "Already subscribed",
            source: "ios",
          },
        },
      }),
    );

    const error = await request("/billing/checkout-session", {
      baseUrl: API_BASE_URL,
      method: "POST",
      fetchImpl,
    }).catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      status: 409,
      code: "ALREADY_SUBSCRIBED",
      source: "ios",
      message: "Already subscribed",
    });
  });

  it("maps a backend error payload onto ApiError", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 400,
        body: {
          error: {
            code: "VALIDATION_ERROR",
            message: "email is required",
          },
        },
      }),
    );

    const error = await request("/support/contact", {
      baseUrl: API_BASE_URL,
      fetchImpl,
    }).catch((caught: unknown) => caught);

    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({
      name: "ApiError",
      status: 400,
      code: "VALIDATION_ERROR",
      message: "email is required",
    });
    expect(error).toBeInstanceOf(ApiError);
  });

  it("maps a 409 billing source onto ApiError, including null", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 409,
        body: {
          error: {
            code: "NOT_STRIPE_PLAN",
            message: "Manage plan is only available for Stripe subscriptions.",
            source: null,
          },
        },
      }),
    );

    await expect(
      request("/billing/portal-session", {
        baseUrl: API_BASE_URL,
        method: "POST",
        fetchImpl,
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "NOT_STRIPE_PLAN",
      source: null,
    });
  });

  it("includes Retry-After seconds on ApiError", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 429,
        body: { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        headers: new Headers({ "Retry-After": "180" }),
      }),
    );

    await expect(
      request("/support/contact", { baseUrl: API_BASE_URL, fetchImpl }),
    ).rejects.toMatchObject({
      status: 429,
      code: "RATE_LIMITED",
      retryAfterSeconds: 180,
    });
  });

  it("aborts via AbortController when the timeout elapses", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const handleAbort = () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          };

          if (init?.signal?.aborted) {
            handleAbort();
            return;
          }

          init?.signal?.addEventListener("abort", handleAbort, { once: true });
        }),
    );

    const pending = request("/me", {
      baseUrl: API_BASE_URL,
      timeoutMs: 50,
      fetchImpl: fetchImpl as typeof fetch,
    }).catch((caught: unknown) => caught);

    await vi.advanceTimersByTimeAsync(50);

    const error = await pending;
    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({
      code: "TIMEOUT",
      message: "Request timed out.",
    });
    expect((fetchImpl.mock.calls[0]?.[1] as RequestInit).signal).toBeInstanceOf(
      AbortSignal,
    );
  });

  it("returns undefined for a 204 response with no body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
      json: async () => {
        throw new Error("Unexpected end of JSON input");
      },
    });

    await expect(
      request("/wardrobes/wd_1", {
        baseUrl: API_BASE_URL,
        method: "DELETE",
        fetchImpl,
      }),
    ).resolves.toBeUndefined();

    const [url, options] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/wardrobes/wd_1");
    expect(options.method).toBe("DELETE");
  });

  it("throws MISCONFIGURED when no base URL is available", async () => {
    const fetchImpl = vi.fn();

    await expect(request("/me", { fetchImpl })).rejects.toMatchObject({
      code: "MISCONFIGURED",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
