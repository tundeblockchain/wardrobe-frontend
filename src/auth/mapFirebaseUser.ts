import type { AuthUser } from "./authContext";
import { mapAuthProviderId } from "./authProviderLabel";

export type FirebaseProviderData = {
  providerId?: string | null;
};

export type FirebaseUserLike = {
  uid: string;
  email: string | null;
  displayName: string | null;
  providerData?: Array<FirebaseProviderData | null> | null;
};

export const mapFirebaseUser = (firebaseUser: FirebaseUserLike): AuthUser => {
  const providerId = firebaseUser.providerData?.find(
    (entry) => entry?.providerId,
  )?.providerId;

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    provider: mapAuthProviderId(providerId),
  };
};
