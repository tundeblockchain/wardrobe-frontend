import type { AuthActions } from "../auth/authContext";
import { getPublicAppEnv } from "../config/env";
import {
  ApiError,
  DEFAULT_REQUEST_TIMEOUT_MS,
  isApiError,
  request,
  type RequestOptions,
} from "./httpClient";

export const ADMIN_SUPPORT_CONVERSATIONS_PATH = "/admin/support/conversations";
export const DEFAULT_CONVERSATION_LIMIT = 50;
export const MIN_CONVERSATION_LIMIT = 1;
export const MAX_CONVERSATION_LIMIT = 100;
export const REPLY_MESSAGE_MIN = 1;
export const REPLY_MESSAGE_MAX = 5000;

export const SUPPORT_CONVERSATION_STATUSES = [
  "open",
  "replied",
  "closed",
] as const;
export const SUPPORT_FEEDBACK_TYPES = ["bug", "query"] as const;
export const SUPPORT_MESSAGE_AUTHORS = ["user", "admin"] as const;
export const SUPPORT_EMAIL_STATUSES = ["sent", "failed", "skipped"] as const;

export type SupportConversationStatus =
  (typeof SUPPORT_CONVERSATION_STATUSES)[number];
export type SupportFeedbackType = (typeof SUPPORT_FEEDBACK_TYPES)[number];
export type SupportMessageAuthor = (typeof SUPPORT_MESSAGE_AUTHORS)[number];
export type SupportEmailStatus = (typeof SUPPORT_EMAIL_STATUSES)[number];

export type SupportConversationSummary = {
  conversationId: string;
  status: SupportConversationStatus;
  type: SupportFeedbackType;
  email: string;
  platform: string;
  uid: string | null;
  createdAt: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  lastMessageAuthor: SupportMessageAuthor;
  lastEmailStatus: SupportEmailStatus | null;
};

export type SupportConversationListResponse = {
  items: SupportConversationSummary[];
  nextCursor: string | null;
};

export type SupportConversationDetail = {
  conversationId: string;
  status: SupportConversationStatus;
  type: SupportFeedbackType;
  email: string;
  platform: string;
  uid: string | null;
  appVersion: string | null;
  device: string | null;
  createdAt: string;
  lastMessageAt: string;
};

export type SupportMessage = {
  messageId: string;
  author: SupportMessageAuthor;
  body: string;
  createdAt: string;
  screenshotUrl: string | null;
  emailStatus: SupportEmailStatus | null;
};

export type SupportConversationDetailResponse = {
  conversation: SupportConversationDetail;
  messages: SupportMessage[];
};

export type SupportReplyResponse = {
  messageId: string;
  emailStatus: "sent" | "failed";
};

export type SupportCloseResponse = {
  conversationId: string;
  status: "closed";
};

export type SupportRetryEmailResponse = {
  messageId: string;
  emailStatus: SupportEmailStatus;
};

export type ListSupportConversationsInput = {
  status?: SupportConversationStatus;
  limit?: number;
  cursor?: string;
};

export type AdminSupportAuth = Pick<AuthActions, "getIdToken">;

export type AdminSupportApiDependencies = {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
  onUnauthorized?: () => void | Promise<void>;
  onForbidden?: () => void | Promise<void>;
};

export type AdminSupportApi = {
  listConversations: (
    input?: ListSupportConversationsInput,
  ) => Promise<SupportConversationListResponse>;
  getConversation: (
    conversationId: string,
  ) => Promise<SupportConversationDetailResponse>;
  reply: (
    conversationId: string,
    message: string,
  ) => Promise<SupportReplyResponse>;
  close: (conversationId: string) => Promise<SupportCloseResponse>;
  retryEmail: (
    conversationId: string,
    messageId: string,
  ) => Promise<SupportRetryEmailResponse>;
};

export const isSupportConversationStatus = (
  value: string,
): value is SupportConversationStatus => {
  return SUPPORT_CONVERSATION_STATUSES.includes(
    value as SupportConversationStatus,
  );
};

export const isSupportFeedbackType = (
  value: string,
): value is SupportFeedbackType => {
  return SUPPORT_FEEDBACK_TYPES.includes(value as SupportFeedbackType);
};

export const isSupportMessageAuthor = (
  value: string,
): value is SupportMessageAuthor => {
  return SUPPORT_MESSAGE_AUTHORS.includes(value as SupportMessageAuthor);
};

export const isSupportEmailStatus = (
  value: string,
): value is SupportEmailStatus => {
  return SUPPORT_EMAIL_STATUSES.includes(value as SupportEmailStatus);
};

export const clampConversationLimit = (limit?: number): number => {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_CONVERSATION_LIMIT;
  }

  const rounded = Math.trunc(limit);
  if (rounded < MIN_CONVERSATION_LIMIT) {
    return MIN_CONVERSATION_LIMIT;
  }

  if (rounded > MAX_CONVERSATION_LIMIT) {
    return MAX_CONVERSATION_LIMIT;
  }

  return rounded;
};

export const buildConversationsQuery = (
  input: ListSupportConversationsInput = {},
): string => {
  const status = isSupportConversationStatus(input.status ?? "open")
    ? (input.status ?? "open")
    : "open";
  const limit = clampConversationLimit(input.limit);
  const params = new URLSearchParams({
    status,
    limit: String(limit),
  });
  const cursor = input.cursor?.trim();
  if (cursor) {
    params.set("cursor", cursor);
  }

  return `${ADMIN_SUPPORT_CONVERSATIONS_PATH}?${params.toString()}`;
};

export const getConversationPath = (conversationId: string): string => {
  return `${ADMIN_SUPPORT_CONVERSATIONS_PATH}/${encodeURIComponent(conversationId)}`;
};

export const getConversationRepliesPath = (conversationId: string): string => {
  return `${getConversationPath(conversationId)}/replies`;
};

export const getConversationClosePath = (conversationId: string): string => {
  return `${getConversationPath(conversationId)}/close`;
};

export const getRetryEmailPath = (
  conversationId: string,
  messageId: string,
): string => {
  return `${getConversationPath(conversationId)}/messages/${encodeURIComponent(messageId)}/retry-email`;
};

export const validateReplyMessage = (message: string): string | undefined => {
  const trimmed = message.trim();
  if (trimmed.length < REPLY_MESSAGE_MIN) {
    return "Enter a reply.";
  }

  if (trimmed.length > REPLY_MESSAGE_MAX) {
    return `Reply must be ${REPLY_MESSAGE_MAX} characters or fewer.`;
  }

  return undefined;
};

const readOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readDisplayString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const readOptionalEnum = <T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return allowed.includes(trimmed as T) ? (trimmed as T) : null;
};

const readRequiredString = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError({
      status: 0,
      code: "INVALID_RESPONSE",
      message: `Support inbox response is missing ${fieldName}.`,
    });
  }

  return value;
};

const parseConversationSummary = (
  value: unknown,
): SupportConversationSummary | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const conversationId = readDisplayString(record.conversationId);
  const status = readOptionalEnum(record.status, SUPPORT_CONVERSATION_STATUSES);
  if (!conversationId || !status) {
    return null;
  }

  return {
    conversationId,
    status,
    type: readOptionalEnum(record.type, SUPPORT_FEEDBACK_TYPES) ?? "query",
    email: readDisplayString(record.email),
    platform: readDisplayString(record.platform),
    uid: readOptionalString(record.uid),
    createdAt: readDisplayString(record.createdAt),
    lastMessageAt: readDisplayString(record.lastMessageAt),
    lastMessagePreview: readDisplayString(record.lastMessagePreview),
    lastMessageAuthor:
      readOptionalEnum(record.lastMessageAuthor, SUPPORT_MESSAGE_AUTHORS) ??
      "user",
    lastEmailStatus: readOptionalEnum(
      record.lastEmailStatus,
      SUPPORT_EMAIL_STATUSES,
    ),
  };
};

const parseConversationDetail = (
  value: unknown,
): SupportConversationDetail => {
  if (!value || typeof value !== "object") {
    throw new ApiError({
      status: 0,
      code: "INVALID_RESPONSE",
      message: "Support inbox conversation is invalid.",
    });
  }

  const record = value as Record<string, unknown>;
  const conversationId = readRequiredString(
    record.conversationId,
    "conversationId",
  );
  const status = readRequiredString(record.status, "status");
  if (!isSupportConversationStatus(status)) {
    throw new ApiError({
      status: 0,
      code: "INVALID_RESPONSE",
      message: "Support inbox conversation has an unknown status.",
    });
  }

  return {
    conversationId,
    status,
    type: readOptionalEnum(record.type, SUPPORT_FEEDBACK_TYPES) ?? "query",
    email: readDisplayString(record.email),
    platform: readDisplayString(record.platform),
    uid: readOptionalString(record.uid),
    appVersion: readOptionalString(record.appVersion),
    device: readOptionalString(record.device),
    createdAt: readDisplayString(record.createdAt),
    lastMessageAt: readDisplayString(record.lastMessageAt),
  };
};

const parseMessage = (value: unknown): SupportMessage => {
  if (!value || typeof value !== "object") {
    throw new ApiError({
      status: 0,
      code: "INVALID_RESPONSE",
      message: "Support inbox message is invalid.",
    });
  }

  const record = value as Record<string, unknown>;
  const author = readRequiredString(record.author, "author");
  const emailStatus =
    record.emailStatus === null || record.emailStatus === undefined
      ? null
      : readRequiredString(record.emailStatus, "emailStatus");

  if (!isSupportMessageAuthor(author)) {
    throw new ApiError({
      status: 0,
      code: "INVALID_RESPONSE",
      message: "Support inbox message has an unknown author.",
    });
  }

  if (emailStatus !== null && !isSupportEmailStatus(emailStatus)) {
    throw new ApiError({
      status: 0,
      code: "INVALID_RESPONSE",
      message: "Support inbox message has an unknown email status.",
    });
  }

  return {
    messageId: readRequiredString(record.messageId, "messageId"),
    author,
    body: readRequiredString(record.body, "body"),
    createdAt: readRequiredString(record.createdAt, "createdAt"),
    screenshotUrl: readOptionalString(record.screenshotUrl),
    emailStatus,
  };
};

export const parseConversationListResponse = (
  value: unknown,
): SupportConversationListResponse => {
  if (!value || typeof value !== "object") {
    throw new ApiError({
      status: 0,
      code: "INVALID_RESPONSE",
      message: "Support inbox list response is invalid.",
    });
  }

  const record = value as { items?: unknown; nextCursor?: unknown };
  if (!Array.isArray(record.items)) {
    throw new ApiError({
      status: 0,
      code: "INVALID_RESPONSE",
      message: "Support inbox list response is missing items.",
    });
  }

  return {
    items: record.items.flatMap((item) => {
      const parsed = parseConversationSummary(item);
      if (!parsed) {
        console.warn(
          "Skipping support conversation list item without conversationId or status.",
        );
        return [];
      }

      return [parsed];
    }),
    nextCursor: readOptionalString(record.nextCursor),
  };
};

export const parseConversationDetailResponse = (
  value: unknown,
): SupportConversationDetailResponse => {
  if (!value || typeof value !== "object") {
    throw new ApiError({
      status: 0,
      code: "INVALID_RESPONSE",
      message: "Support inbox thread response is invalid.",
    });
  }

  const record = value as { conversation?: unknown; messages?: unknown };
  if (!Array.isArray(record.messages)) {
    throw new ApiError({
      status: 0,
      code: "INVALID_RESPONSE",
      message: "Support inbox thread response is missing messages.",
    });
  }

  return {
    conversation: parseConversationDetail(record.conversation),
    messages: record.messages.map(parseMessage),
  };
};

export const parseReplyResponse = (value: unknown): SupportReplyResponse => {
  if (!value || typeof value !== "object") {
    throw new ApiError({
      status: 0,
      code: "INVALID_RESPONSE",
      message: "Support inbox reply response is invalid.",
    });
  }

  const record = value as { messageId?: unknown; emailStatus?: unknown };
  const emailStatus = readRequiredString(record.emailStatus, "emailStatus");
  if (emailStatus !== "sent" && emailStatus !== "failed") {
    throw new ApiError({
      status: 0,
      code: "INVALID_RESPONSE",
      message: "Support inbox reply response has an unknown email status.",
    });
  }

  return {
    messageId: readRequiredString(record.messageId, "messageId"),
    emailStatus,
  };
};

export const parseCloseResponse = (value: unknown): SupportCloseResponse => {
  if (!value || typeof value !== "object") {
    throw new ApiError({
      status: 0,
      code: "INVALID_RESPONSE",
      message: "Support inbox close response is invalid.",
    });
  }

  const record = value as { conversationId?: unknown; status?: unknown };
  const status = readRequiredString(record.status, "status");
  if (status !== "closed") {
    throw new ApiError({
      status: 0,
      code: "INVALID_RESPONSE",
      message: "Support inbox close response is missing closed status.",
    });
  }

  return {
    conversationId: readRequiredString(record.conversationId, "conversationId"),
    status,
  };
};

export const parseRetryEmailResponse = (
  value: unknown,
): SupportRetryEmailResponse => {
  if (!value || typeof value !== "object") {
    throw new ApiError({
      status: 0,
      code: "INVALID_RESPONSE",
      message: "Support inbox retry-email response is invalid.",
    });
  }

  const record = value as { messageId?: unknown; emailStatus?: unknown };
  const emailStatus = readRequiredString(record.emailStatus, "emailStatus");
  if (!isSupportEmailStatus(emailStatus)) {
    throw new ApiError({
      status: 0,
      code: "INVALID_RESPONSE",
      message: "Support inbox retry-email response has an unknown email status.",
    });
  }

  return {
    messageId: readRequiredString(record.messageId, "messageId"),
    emailStatus,
  };
};

const buildAuthorizedHeaders = (
  token: string,
  headers?: Record<string, string>,
): Record<string, string> => {
  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
};

const handleAuthError = async (
  error: unknown,
  dependencies: AdminSupportApiDependencies,
): Promise<never> => {
  if (!isApiError(error)) {
    throw error;
  }

  if (error.status === 401 || error.code === "unauthorized") {
    await dependencies.onUnauthorized?.();
  } else if (error.status === 403 || error.code === "forbidden") {
    await dependencies.onForbidden?.();
  }

  throw error;
};

export const createAdminSupportApi = (
  auth: AdminSupportAuth,
  dependencies: AdminSupportApiDependencies = {},
): AdminSupportApi => {
  const {
    fetchImpl,
    baseUrl = getPublicAppEnv().apiBaseUrl,
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    onUnauthorized,
    onForbidden,
  } = dependencies;

  const send = async <T>(
    path: string,
    options: Omit<RequestOptions, "baseUrl" | "fetchImpl"> = {},
    forceRefresh = false,
  ): Promise<T> => {
    const token = await auth.getIdToken(forceRefresh);
    if (!token) {
      await onUnauthorized?.();
      throw new ApiError({
        status: 401,
        code: "unauthorized",
        message: "Not signed in.",
      });
    }

    try {
      return await request<T>(path, {
        ...options,
        headers: buildAuthorizedHeaders(token, options.headers),
        fetchImpl,
        baseUrl,
        timeoutMs: options.timeoutMs ?? timeoutMs,
      });
    } catch (error) {
      if (!isApiError(error) || error.status !== 401 || forceRefresh) {
        await handleAuthError(error, { onUnauthorized, onForbidden });
      }

      return send<T>(path, options, true);
    }
  };

  const listConversations = async (
    input: ListSupportConversationsInput = {},
  ): Promise<SupportConversationListResponse> => {
    const payload = await send<unknown>(buildConversationsQuery(input));
    return parseConversationListResponse(payload);
  };

  const getConversation = async (
    conversationId: string,
  ): Promise<SupportConversationDetailResponse> => {
    const payload = await send<unknown>(getConversationPath(conversationId));
    return parseConversationDetailResponse(payload);
  };

  const reply = async (
    conversationId: string,
    message: string,
  ): Promise<SupportReplyResponse> => {
    const payload = await send<unknown>(getConversationRepliesPath(conversationId), {
      method: "POST",
      body: { message },
    });
    return parseReplyResponse(payload);
  };

  const close = async (
    conversationId: string,
  ): Promise<SupportCloseResponse> => {
    const payload = await send<unknown>(getConversationClosePath(conversationId), {
      method: "POST",
    });
    return parseCloseResponse(payload);
  };

  const retryEmail = async (
    conversationId: string,
    messageId: string,
  ): Promise<SupportRetryEmailResponse> => {
    const payload = await send<unknown>(
      getRetryEmailPath(conversationId, messageId),
      { method: "POST" },
    );
    return parseRetryEmailResponse(payload);
  };

  return {
    listConversations,
    getConversation,
    reply,
    close,
    retryEmail,
  };
};
