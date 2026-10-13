import { createContext } from "react";

export type AuthUser = {
  id: string;
  email?: string | null;
  displayName?: string | null;
};

export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
};

export type AuthActions = {
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
};

export type AuthContextValue = AuthState & AuthActions;

export type AuthController = {
  isControlled: boolean;
  setAuthUser: (user: AuthUser | null) => void;
  setAuthLoading: (loading: boolean) => void;
};

export const defaultAuthState: AuthState = {
  user: null,
  loading: false,
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export const AuthControllerContext = createContext<AuthController | undefined>(
  undefined,
);
