export const AUTH_PROVIDERS = ["google", "apple", "email"] as const;

export type AuthProviderName = (typeof AUTH_PROVIDERS)[number];

export const mapAuthProviderId = (
  providerId: string | null | undefined,
): AuthProviderName | undefined => {
  if (providerId === "google.com") {
    return "google";
  }
  if (providerId === "apple.com") {
    return "apple";
  }
  if (providerId === "password") {
    return "email";
  }

  return undefined;
};

export const getSignedInWithLabel = (
  provider: AuthProviderName | undefined,
): string => {
  if (provider === "google") {
    return "Signed in with Google";
  }
  if (provider === "apple") {
    return "Signed in with Apple";
  }
  if (provider === "email") {
    return "Signed in with Email";
  }

  return "Signed in";
};
