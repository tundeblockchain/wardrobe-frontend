import { getPublicAppEnv } from "../config/env";

export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly retryAfterSeconds?: number;
  readonly source?: string | null;

  constructor({
    status,
    code,
    message,
    retryAfterSeconds,
    source,
  }: {
    status: number;
    code?: string;
    message?: string;
    retryAfterSeconds?: number;
    source?: string | null;
  }) {
    super(message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
    this.source = source;
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  timeoutMs?: number;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
};

export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

export const joinApiUrl = (baseUrl: string, path: string): string => {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const trimmedPath = path.trim();
  if (trimmedPath.length === 0) {
    return normalizedBase;
  }

  if (/^https?:\/\//i.test(trimmedPath)) {
    return trimmedPath;
  }

  const normalizedPath = trimmedPath.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
};

const isAbsoluteUrl = (value: string): boolean => {
  return /^https?:\/\//i.test(value);
};

const readBackendError = (
  value: unknown,
): { code?: string; message?: string; source?: string | null } => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const record = value as { error?: unknown };
  if (!record.error || typeof record.error !== "object") {
    return {};
  }

  const errorRecord = record.error as {
    code?: unknown;
    message?: unknown;
    source?: unknown;
  };
  return {
    code: typeof errorRecord.code === "string" ? errorRecord.code : undefined,
    message:
      typeof errorRecord.message === "string" ? errorRecord.message : undefined,
    source: readBackendErrorSource(errorRecord.source),
  };
};

const readBackendErrorSource = (
  value: unknown,
): string | null | undefined => {
  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return undefined;
};

const parseRetryAfterSeconds = (
  headers: Headers | undefined,
): number | undefined => {
  if (!headers || typeof headers.get !== "function") {
    return undefined;
  }

  const rawValue = headers.get("Retry-After");
  if (!rawValue) {
    return undefined;
  }

  const seconds = Number.parseInt(rawValue.trim(), 10);
  if (!Number.isFinite(seconds) || seconds < 0) {
    return undefined;
  }

  return seconds;
};

const isAbortError = (error: unknown): boolean => {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }

  return error instanceof Error && error.name === "AbortError";
};

const parseJsonBody = async (response: Response): Promise<unknown> => {
  if (typeof response.json !== "function") {
    return undefined;
  }

  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

const resolveRequestUrl = (path: string, baseUrl?: string): string => {
  if (isAbsoluteUrl(path)) {
    return path;
  }

  const resolvedBaseUrl = baseUrl ?? getPublicAppEnv().apiBaseUrl;
  if (!resolvedBaseUrl) {
    throw new ApiError({
      status: 0,
      code: "MISCONFIGURED",
      message: "API base URL is not configured.",
    });
  }

  return joinApiUrl(resolvedBaseUrl, path);
};

export const request = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const {
    method = "GET",
    body,
    headers,
    credentials,
    timeoutMs,
    signal: externalSignal,
    fetchImpl = fetch,
    baseUrl,
  } = options;

  const url = resolveRequestUrl(path, baseUrl);
  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (headers) {
    Object.assign(requestHeaders, headers);
  }

  const timeoutController =
    timeoutMs !== undefined && timeoutMs > 0 ? new AbortController() : undefined;
  let timedOut = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (timeoutController) {
    const handleExternalAbort = () => {
      timeoutController.abort();
    };

    if (externalSignal?.aborted) {
      timeoutController.abort();
    } else {
      externalSignal?.addEventListener("abort", handleExternalAbort, {
        once: true,
      });
    }

    timeoutId = setTimeout(() => {
      timedOut = true;
      timeoutController.abort();
    }, timeoutMs);
  }

  const signal = timeoutController?.signal ?? externalSignal;
  const init: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (credentials !== undefined) {
    init.credentials = credentials;
  }

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  if (signal !== undefined) {
    init.signal = signal;
  }

  try {
    const response = await fetchImpl(url, init);
    if (!response.ok) {
      const payload = await parseJsonBody(response);
      const backendError = readBackendError(payload);
      throw new ApiError({
        status: response.status,
        code: backendError.code,
        message: backendError.message,
        retryAfterSeconds: parseRetryAfterSeconds(response.headers),
        source: backendError.source,
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await parseJsonBody(response)) as T;
  } catch (error) {
    if (isApiError(error)) {
      throw error;
    }

    if (isAbortError(error)) {
      throw new ApiError({
        status: 0,
        code: timedOut ? "TIMEOUT" : "NETWORK",
        message: timedOut ? "Request timed out." : "Request was aborted.",
      });
    }

    throw new ApiError({
      status: 0,
      code: "NETWORK",
      message: error instanceof Error ? error.message : "Network request failed.",
    });
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
};
