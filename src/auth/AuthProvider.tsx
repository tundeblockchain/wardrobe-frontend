import type { PropsWithChildren } from "react";
import {
  AuthContext,
  defaultAuthState,
  type AuthState,
} from "./authContext";

export type { AuthState, AuthUser } from "./authContext";

export type AuthProviderProps = PropsWithChildren<{
  initialState?: AuthState;
}>;

export const AuthProvider = ({
  children,
  initialState = defaultAuthState,
}: AuthProviderProps) => {
  return (
    <AuthContext.Provider value={initialState}>{children}</AuthContext.Provider>
  );
};
