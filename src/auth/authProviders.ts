import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirebaseAuth } from "../firebase/config";

export const APPLE_AUTH_PROVIDER_ID = "apple.com";

export const signInWithGoogle = async (): Promise<void> => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(getFirebaseAuth(), provider);
};

export const signInWithApple = async (): Promise<void> => {
  const provider = new OAuthProvider(APPLE_AUTH_PROVIDER_ID);
  provider.addScope("email");
  provider.addScope("name");
  await signInWithPopup(getFirebaseAuth(), provider);
};

export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<void> => {
  await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
};

export const registerWithEmail = async (
  email: string,
  password: string,
): Promise<void> => {
  await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
};

export const signOutUser = async (): Promise<void> => {
  await signOut(getFirebaseAuth());
};

export const getIdToken = async (
  forceRefresh = false,
): Promise<string | null> => {
  const currentUser = getFirebaseAuth().currentUser;
  if (!currentUser) {
    return null;
  }

  return currentUser.getIdToken(forceRefresh);
};
