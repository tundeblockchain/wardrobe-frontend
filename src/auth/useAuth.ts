import { useContext } from "react";
import {
  AuthContext,
  AuthControllerContext,
  type AuthContextValue,
  type AuthController,
} from "./authContext";

export const useAuth = (): AuthContextValue => {
  const authState = useContext(AuthContext);
  if (!authState) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return authState;
};

export const useAuthController = (): AuthController => {
  const authController = useContext(AuthControllerContext);
  if (!authController) {
    throw new Error("useAuthController must be used within AuthProvider");
  }

  return authController;
};
