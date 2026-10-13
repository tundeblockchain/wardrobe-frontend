import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  createAuthenticatedApi,
  type AuthenticatedApi,
} from "./authenticatedApi";

export const useApi = (): AuthenticatedApi => {
  const { getIdToken, signOut } = useAuth();
  const navigate = useNavigate();

  return useMemo(
    () => createAuthenticatedApi({ getIdToken, signOut }, { navigate }),
    [getIdToken, navigate, signOut],
  );
};
