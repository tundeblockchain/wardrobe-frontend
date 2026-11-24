import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getAdminFirebaseAuth } from "./adminFirebase";

export { isAdminClaim } from "./adminAuthContext";

export const signInAdminWithGoogle = async (): Promise<void> => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(getAdminFirebaseAuth(), provider);
};

export const signInAdminWithEmail = async (
  email: string,
  password: string,
): Promise<void> => {
  await signInWithEmailAndPassword(
    getAdminFirebaseAuth(),
    email.trim(),
    password,
  );
};

export const signOutAdmin = async (): Promise<void> => {
  await signOut(getAdminFirebaseAuth());
};

export const getAdminIdToken = async (
  forceRefresh = false,
): Promise<string | null> => {
  const currentUser = getAdminFirebaseAuth().currentUser;
  if (!currentUser) {
    return null;
  }

  return currentUser.getIdToken(forceRefresh);
};

