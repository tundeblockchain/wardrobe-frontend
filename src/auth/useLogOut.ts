import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appPaths } from "../routes/paths";
import { clearClientSessionCache } from "./clearClientSessionCache";
import { useAuth, useAuthController } from "./useAuth";

export type UseLogOutResult = {
  isLoggingOut: boolean;
  handleLogOut: () => Promise<void>;
};

export const useLogOut = (): UseLogOutResult => {
  const { signOut } = useAuth();
  const { setAuthUser } = useAuthController();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isLoggingOutRef = useRef(false);

  const handleLogOut = async (): Promise<void> => {
    if (isLoggingOutRef.current) {
      return;
    }

    isLoggingOutRef.current = true;
    setIsLoggingOut(true);

    try {
      await signOut();
    } catch {
      // Sign-out failures still clear local session state and go to login.
    } finally {
      clearClientSessionCache();
      setAuthUser(null);
      navigate(appPaths.login, { replace: true });
    }
  };

  return {
    isLoggingOut,
    handleLogOut,
  };
};
