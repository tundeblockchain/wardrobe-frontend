import type { AuthUser } from "./authContext";

export type FirebaseUserLike = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

export const mapFirebaseUser = (firebaseUser: FirebaseUserLike): AuthUser => {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
  };
};
