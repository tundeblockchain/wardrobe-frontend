import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { hasFirebaseWebConfig } from "../config/env";
import { getFirebaseAuth } from "../firebase/config";
import { mapFirebaseUser } from "./mapFirebaseUser";
import { useAuthController } from "./useAuth";

export const useFirebaseAuthListener = () => {
  const { isControlled, setAuthLoading, setAuthUser } = useAuthController();

  useEffect(() => {
    if (isControlled) {
      return;
    }

    if (!hasFirebaseWebConfig()) {
      setAuthUser(null);
      setAuthLoading(false);
      return;
    }

    setAuthLoading(true);
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (firebaseUser) => {
      setAuthUser(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, [isControlled, setAuthLoading, setAuthUser]);
};
