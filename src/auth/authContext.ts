import { createContext } from "react";

export type AuthUser = {
  id: string;
};

export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
};

export const defaultAuthState: AuthState = {
  user: null,
  loading: false,
};

export const AuthContext = createContext<AuthState | undefined>(undefined);
