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
  type Entitlement,
  type EntitlementStore,
} from "./resourceTypes";

export const ME_STORES = ENTITLEMENT_STORES;
export type MeStore = EntitlementStore;
export type MeResponse = Entitlement;

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
    return send<MeResponse>("/me");
  };

  return {
    request: send,
    getMe,
  };
};
