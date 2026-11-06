import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type UserCredential,
} from "firebase/auth";
import { trackEvent } from "../config/trackingEvents";
import { getFirebaseAuth } from "../firebase/config";

export const APPLE_AUTH_PROVIDER_ID = "apple.com";

const trackSocialCredential = (
  credential: UserCredential,
  method: "google" | "apple",
): void => {
  const isNewUser = Boolean(getAdditionalUserInfo(credential)?.isNewUser);
  trackEvent(isNewUser ? "sign_up" : "login", { method });
};

export const signInWithGoogle = async (): Promise<void> => {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(getFirebaseAuth(), provider);
  trackSocialCredential(credential, "google");
};

export const signInWithApple = async (): Promise<void> => {
  const provider = new OAuthProvider(APPLE_AUTH_PROVIDER_ID);
  provider.addScope("email");
  provider.addScope("name");
  const credential = await signInWithPopup(getFirebaseAuth(), provider);
  trackSocialCredential(credential, "apple");
};

export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<void> => {
  await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  trackEvent("login", { method: "email" });
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
  trackEvent("sign_up", { method: "email" });
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
