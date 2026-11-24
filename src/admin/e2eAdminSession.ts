import type { AdminUser } from "./adminAuthContext";

export type E2EAdminSession = {
  user: AdminUser;
  admin: boolean;
  idToken: string;
} | null;

declare global {
  interface Window {
    __E2E_ADMIN_SESSION__?: E2EAdminSession;
  }
}

export const E2E_ADMIN_SESSION_KEY = "__E2E_ADMIN_SESSION__";

export const isE2EAdminMode = (): boolean => {
  return import.meta.env.MODE === "e2e";
};

export const hasE2EAdminSessionOverride = (): boolean => {
  if (!isE2EAdminMode() || typeof window === "undefined") {
    return false;
  }

  return E2E_ADMIN_SESSION_KEY in window;
};

export const readE2EAdminSession = (): E2EAdminSession | undefined => {
  if (!hasE2EAdminSessionOverride()) {
    return undefined;
  }

  return window.__E2E_ADMIN_SESSION__ ?? null;
};
