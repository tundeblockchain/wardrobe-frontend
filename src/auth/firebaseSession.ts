import { useEffect } from "react";
import { hasFirebaseWebConfig } from "../config/env";
import type { AuthController } from "./authContext";
import { useAuthController } from "./useAuth";

type AuthSessionController = Pick<AuthController, "setAuthLoading" | "setAuthUser">;

const loadFirebaseAuth = () => import("firebase/auth");
const loadFirebaseConfig = () => import("../firebase/config");
const loadMapFirebaseUser = () => import("./mapFirebaseUser");

export const subscribeToFirebaseAuth = async (
  controller: AuthSessionController,
): Promise<() => void> => {
  if (!hasFirebaseWebConfig()) {
    controller.setAuthUser(null);
    controller.setAuthLoading(false);
    return () => undefined;
  }

  controller.setAuthLoading(true);
  const [{ onAuthStateChanged }, { getFirebaseAuth }, { mapFirebaseUser }] =
    await Promise.all([
      loadFirebaseAuth(),
      loadFirebaseConfig(),
      loadMapFirebaseUser(),
    ]);

  return onAuthStateChanged(getFirebaseAuth(), (firebaseUser) => {
    controller.setAuthUser(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
    controller.setAuthLoading(false);
  });
};

export const useFirebaseAuthListener = () => {
  const { isControlled, setAuthLoading, setAuthUser } = useAuthController();

  useEffect(() => {
    if (isControlled) {
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const start = async () => {
      const stop = await subscribeToFirebaseAuth({
        setAuthLoading,
        setAuthUser,
      });
      if (cancelled) {
        stop();
        return;
      }
      unsubscribe = stop;
    };

    void start();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [isControlled, setAuthLoading, setAuthUser]);
};
