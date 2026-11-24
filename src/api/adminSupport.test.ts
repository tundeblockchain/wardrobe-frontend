import { describe, expect, it, vi } from "vitest";
import {
  buildConversationsQuery,
  createAdminSupportApi,
  DEFAULT_CONVERSATION_LIMIT,
  parseConversationDetailResponse,
  parseConversationListResponse,
  validateReplyMessage,
} from "./adminSupport";
import { isApiError } from "./httpClient";

const API_BASE_URL = "https://api.example.com";

const listItem = {
  conversationId: "conv_1",
  status: "open",
  type: "bug",
  email: "user@example.com",
  platform: "ios",
  uid: "user-1",
  createdAt: "2026-11-24T10:00:00.000Z",
  lastMessageAt: "2026-11-24T11:00:00.000Z",
  lastMessagePreview: "The upload failed",
  lastMessageAuthor: "user",
  lastEmailStatus: null,
};

const threadBody = {
  conversation: {
    conversationId: "conv_1",
    status: "open",
    type: "bug",
    email: "user@example.com",
    platform: "ios",
    uid: "user-1",
    appVersion: "1.2.3",
    device: "iPhone",
    createdAt: "2026-11-24T10:00:00.000Z",
    lastMessageAt: "2026-11-24T11:00:00.000Z",
  },
  messages: [
    {
      messageId: "msg_1",
      author: "user",
      body: "The upload failed",
      createdAt: "2026-11-24T11:00:00.000Z",
      screenshotUrl: "https://cdn.example.com/shot.png",
      emailStatus: null,
    },
  ],
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
  const onUnauthorized = vi.fn();
  const onForbidden = vi.fn();
  const api = createAdminSupportApi(
    { getIdToken },
    {
      fetchImpl,
      baseUrl: API_BASE_URL,
      onUnauthorized,
      onForbidden,
    },
  );

  return { api, getIdToken, onUnauthorized, onForbidden };
};

const readAuthorization = (init: RequestInit | undefined): string | undefined => {
  const headers = init?.headers;
  if (!headers || typeof headers !== "object" || Array.isArray(headers)) {
    return undefined;
  }

  return (headers as Record<string, string>).Authorization;
};

describe("buildConversationsQuery", () => {
  it("defaults to open status and limit 50 and omits an empty cursor", () => {
    expect(buildConversationsQuery()).toBe(
      `/admin/support/conversations?status=open&limit=${DEFAULT_CONVERSATION_LIMIT}`,
    );
    expect(
      buildConversationsQuery({ status: "replied", limit: 2, cursor: "c2" }),
    ).toBe("/admin/support/conversations?status=replied&limit=2&cursor=c2");
  });
});

describe("validateReplyMessage", () => {
  it("requires 1 to 5000 characters", () => {
    expect(validateReplyMessage("")).toBe("Enter a reply.");
    expect(validateReplyMessage("   ")).toBe("Enter a reply.");
    expect(validateReplyMessage("Thanks")).toBeUndefined();
    expect(validateReplyMessage("x".repeat(5000))).toBeUndefined();
    expect(validateReplyMessage("x".repeat(5001))).toBe(
      "Reply must be 5000 characters or fewer.",
    );
  });
});

describe("parseConversationListResponse", () => {
  it("defaults a missing, null, or empty lastMessagePreview to an empty string", () => {
    const missingPreview = parseConversationListResponse({
      items: [{ ...listItem, lastMessagePreview: undefined }],
      nextCursor: null,
    });
    const nullPreview = parseConversationListResponse({
      items: [{ ...listItem, lastMessagePreview: null }],
      nextCursor: null,
    });
    const emptyPreview = parseConversationListResponse({
      items: [{ ...listItem, lastMessagePreview: "" }],
      nextCursor: null,
    });

    expect(missingPreview.items[0]?.lastMessagePreview).toBe("");
    expect(nullPreview.items[0]?.lastMessagePreview).toBe("");
    expect(emptyPreview.items[0]?.lastMessagePreview).toBe("");
  });

  it("defaults display-only list fields instead of failing the list", () => {
    const parsed = parseConversationListResponse({
      items: [
        {
          conversationId: "conv_legacy",
          status: "open",
          lastMessagePreview: "",
          lastEmailStatus: "",
          uid: "",
        },
      ],
      nextCursor: null,
    });

    expect(parsed.items).toEqual([
      {
        conversationId: "conv_legacy",
        status: "open",
        type: "query",
        email: "",
        platform: "",
        uid: null,
        createdAt: "",
        lastMessageAt: "",
        lastMessagePreview: "",
        lastMessageAuthor: "user",
        lastEmailStatus: null,
      },
    ]);
  });

  it("skips a row missing conversationId or status without failing siblings", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const parsed = parseConversationListResponse({
      items: [
        { ...listItem, conversationId: "" },
        { ...listItem, status: "unknown" },
        listItem,
        { email: "broken@example.com" },
      ],
      nextCursor: "next_1",
    });

    expect(parsed).toEqual({ items: [listItem], nextCursor: "next_1" });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("parseConversationDetailResponse", () => {
  it("defaults empty or missing appVersion, device, and uid to null", () => {
    const parsed = parseConversationDetailResponse({
      conversation: {
        ...threadBody.conversation,
        uid: "",
        appVersion: "",
        device: null,
      },
      messages: threadBody.messages,
    });

    expect(parsed.conversation.uid).toBeNull();
    expect(parsed.conversation.appVersion).toBeNull();
    expect(parsed.conversation.device).toBeNull();
  });
});

describe("createAdminSupportApi", () => {
  it("sends a Bearer Firebase ID token and list query params", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 200,
        body: { items: [listItem], nextCursor: "next_1" },
      }),
    );
    const { api, getIdToken } = createApi({
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(
      api.listConversations({ status: "closed", limit: 25, cursor: "abc" }),
    ).resolves.toEqual({ items: [listItem], nextCursor: "next_1" });

    expect(getIdToken).toHaveBeenCalledWith(false);
    const [url, options] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://api.example.com/admin/support/conversations?status=closed&limit=25&cursor=abc",
    );
    expect(options.method).toBe("GET");
    expect(readAuthorization(options)).toBe("Bearer id-token");
  });

  it("loads a thread, posts a reply, closes, and retries email", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({ status: 200, body: threadBody }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          status: 201,
          body: { messageId: "msg_2", emailStatus: "failed" },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          status: 200,
          body: { conversationId: "conv_1", status: "closed" },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          status: 200,
          body: { messageId: "msg_2", emailStatus: "sent" },
        }),
      );
    const { api } = createApi({ fetchImpl: fetchImpl as typeof fetch });

    await expect(api.getConversation("conv_1")).resolves.toEqual(threadBody);
    await expect(api.reply("conv_1", "We are looking into this.")).resolves.toEqual({
      messageId: "msg_2",
      emailStatus: "failed",
    });
    await expect(api.close("conv_1")).resolves.toEqual({
      conversationId: "conv_1",
      status: "closed",
    });
    await expect(api.retryEmail("conv_1", "msg_2")).resolves.toEqual({
      messageId: "msg_2",
      emailStatus: "sent",
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "https://api.example.com/admin/support/conversations/conv_1",
    );
    expect(fetchImpl.mock.calls[1]?.[0]).toBe(
      "https://api.example.com/admin/support/conversations/conv_1/replies",
    );
    expect((fetchImpl.mock.calls[1]?.[1] as RequestInit).method).toBe("POST");
    expect(JSON.parse(String((fetchImpl.mock.calls[1]?.[1] as RequestInit).body))).toEqual({
      message: "We are looking into this.",
    });
    expect(fetchImpl.mock.calls[2]?.[0]).toBe(
      "https://api.example.com/admin/support/conversations/conv_1/close",
    );
    expect(fetchImpl.mock.calls[3]?.[0]).toBe(
      "https://api.example.com/admin/support/conversations/conv_1/messages/msg_2/retry-email",
    );
  });

  it("maps 401 unauthorized to signed out", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 401,
        body: { error: "unauthorized" },
      }),
    );
    const { api, onUnauthorized, onForbidden, getIdToken } = createApi({
      fetchImpl: fetchImpl as typeof fetch,
    });

    const error = await api.listConversations().catch((caught: unknown) => caught);
    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({ status: 401, code: "unauthorized" });
    expect(getIdToken).toHaveBeenCalledTimes(2);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(onForbidden).not.toHaveBeenCalled();
  });

  it("maps 403 forbidden to not-authorised", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 403,
        body: { error: "forbidden" },
      }),
    );
    const { api, onUnauthorized, onForbidden } = createApi({
      fetchImpl: fetchImpl as typeof fetch,
    });

    const error = await api.getConversation("conv_1").catch((caught: unknown) => caught);
    expect(error).toMatchObject({ status: 403, code: "forbidden" });
    expect(onForbidden).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("maps 400 validation fields, 404 not_found, and 409 not_retryable", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          status: 400,
          body: { error: "validation", fields: { message: "Too long" } },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          status: 404,
          body: { error: "not_found" },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          status: 409,
          body: { error: "not_retryable" },
        }),
      );
    const { api, onUnauthorized, onForbidden } = createApi({
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(api.reply("conv_1", "Hello")).rejects.toMatchObject({
      status: 400,
      code: "validation",
      fields: { message: "Too long" },
    });
    await expect(api.getConversation("missing")).rejects.toMatchObject({
      status: 404,
      code: "not_found",
    });
    await expect(api.retryEmail("conv_1", "msg_9")).rejects.toMatchObject({
      status: 409,
      code: "not_retryable",
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(onForbidden).not.toHaveBeenCalled();
  });
});
