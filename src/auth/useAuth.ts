import { useContext } from "react";
import { AuthContext, type AuthState } from "./authContext";

export const useAuth = (): AuthState => {
  const authState = useContext(AuthContext);
  if (!authState) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return authState;
};
