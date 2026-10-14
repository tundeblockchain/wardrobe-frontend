import type { AuthActions } from "../auth/authContext";
import { appPaths } from "../routes/paths";
import {
  ApiError,
  DEFAULT_REQUEST_TIMEOUT_MS,
  isApiError,
  request,
  type RequestOptions,
} from "./httpClient";
import {
  ENTITLEMENT_STORES,
  type AccountDeleteResult,
  type ContentWipeResult,
  type Entitlement,
  type EntitlementStore,
  type JobEventList,
} from "./resourceTypes";

export const ME_PATH = "/me";
export const ME_CONTENT_PATH = "/me/content";
export const ME_EVENTS_PATH = "/me/events";
export const ACCOUNT_DELETE_TIMEOUT_MS = 60_000;
export const ME_STORES = ENTITLEMENT_STORES;
export type MeStore = EntitlementStore;
export type MeResponse = Entitlement;
export type { AccountDeleteResult, ContentWipeResult, JobEventList };

export type ListJobEventsOptions = {
  unreadOnly?: boolean;
};

export const getMeEventsApiPath = (
  options: ListJobEventsOptions = {},
): string => {
  if (options.unreadOnly === undefined) {
    return ME_EVENTS_PATH;
  }

  const params = new URLSearchParams({
    unreadOnly: options.unreadOnly ? "true" : "false",
  });
  return `${ME_EVENTS_PATH}?${params.toString()}`;
};

export type ApiAuth = Pick<AuthActions, "getIdToken" | "signOut">;

export type AuthenticatedRequestOptions = Omit<
  RequestOptions,
  "baseUrl" | "fetchImpl"
>;

export type AuthenticatedApiDependencies = {
  navigate?: (path: string) => void;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
};

export type AuthenticatedApi = {
  request: <T>(
    path: string,
    options?: AuthenticatedRequestOptions,
  ) => Promise<T>;
  getMe: () => Promise<MeResponse>;
  deleteAccount: () => Promise<AccountDeleteResult>;
  clearContent: () => Promise<ContentWipeResult>;
  listJobEvents: (options?: ListJobEventsOptions) => Promise<JobEventList>;
};

const redirectToLogin = (navigate?: (path: string) => void) => {
  if (navigate) {
    navigate(appPaths.login);
    return;
  }

  if (typeof window !== "undefined") {
    window.location.assign(appPaths.login);
  }
};

const handleUnauthorized = async (
  auth: ApiAuth,
  navigate?: (path: string) => void,
) => {
  try {
    await auth.signOut();
  } finally {
    redirectToLogin(navigate);
  }
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

export const createAuthenticatedApi = (
  auth: ApiAuth,
  dependencies: AuthenticatedApiDependencies = {},
): AuthenticatedApi => {
  const {
    navigate,
    fetchImpl,
    baseUrl,
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  } = dependencies;

  const send = async <T>(
    path: string,
    options: AuthenticatedRequestOptions = {},
    forceRefresh = false,
  ): Promise<T> => {
    const token = await auth.getIdToken(forceRefresh);
    if (!token) {
      await handleUnauthorized(auth, navigate);
      throw new ApiError({
        status: 401,
        code: "UNAUTHENTICATED",
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
      if (!isApiError(error) || error.status !== 401) {
        throw error;
      }

      if (forceRefresh) {
        await handleUnauthorized(auth, navigate);
        throw error;
      }

      return send<T>(path, options, true);
    }
  };

  const getMe = (): Promise<MeResponse> => {
    return send<MeResponse>(ME_PATH);
  };

  const deleteAccount = (): Promise<AccountDeleteResult> => {
    return send<AccountDeleteResult>(ME_PATH, {
      method: "DELETE",
      timeoutMs: ACCOUNT_DELETE_TIMEOUT_MS,
    });
  };

  const clearContent = (): Promise<ContentWipeResult> => {
    return send<ContentWipeResult>(ME_CONTENT_PATH, { method: "DELETE" });
  };

  const listJobEvents = (
    options: ListJobEventsOptions = {},
  ): Promise<JobEventList> => {
    return send<JobEventList>(getMeEventsApiPath(options));
  };

  return {
    request: send,
    getMe,
    deleteAccount,
    clearContent,
    listJobEvents,
  };
};
