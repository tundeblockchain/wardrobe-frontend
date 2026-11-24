import { useContext } from "react";
import { AdminAuthContext, type AdminAuthContextValue } from "./adminAuthContext";

export const useAdminAuth = (): AdminAuthContextValue => {
  const value = useContext(AdminAuthContext);
  if (!value) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }

  return value;
};
