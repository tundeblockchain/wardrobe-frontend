import { createContext } from "react";

export type AdminUser = {
  id: string;
  email?: string | null;
};

export type AdminGateStatus =
  | "unconfigured"
  | "loading"
  | "signed_out"
  | "not_authorised"
  | "ready";

export type AdminAuthState = {
  configured: boolean;
  loading: boolean;
  user: AdminUser | null;
  admin: boolean;
  apiForbidden: boolean;
};

export type AdminAuthActions = {
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  handleUnauthorized: () => Promise<void>;
  handleForbidden: () => void;
};

export type AdminAuthContextValue = AdminAuthState &
  AdminAuthActions & {
    gate: AdminGateStatus;
  };

export const defaultAdminAuthState: AdminAuthState = {
  configured: true,
  loading: false,
  user: null,
  admin: false,
  apiForbidden: false,
};

export const isAdminClaim = (value: unknown): boolean => {
  return value === true;
};

export const resolveAdminGate = (state: AdminAuthState): AdminGateStatus => {
  if (!state.configured) {
    return "unconfigured";
  }

  if (state.loading) {
    return "loading";
  }

  if (!state.user) {
    return "signed_out";
  }

  if (!state.admin || state.apiForbidden) {
    return "not_authorised";
  }

  return "ready";
};

export const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(
  undefined,
);
