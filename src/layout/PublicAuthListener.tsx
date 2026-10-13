import { useEffect } from "react";
import { useAuthController } from "../auth/useAuth";

export const PublicAuthListener = () => {
  const { isControlled, setAuthLoading, setAuthUser } = useAuthController();

  useEffect(() => {
    if (isControlled) {
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const start = async () => {
      const { subscribeToFirebaseAuth } = await import("../auth/firebaseSession");
      if (cancelled) {
        return;
      }

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

  return null;
};
