export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

export type PublicAppEnv = {
  appName: string;
  appStoreUrl: string | undefined;
  playStoreUrl: string | undefined;
  publicSiteUrl: string | undefined;
  apiBaseUrl: string | undefined;
  gaMeasurementId: string | undefined;
  metaPixelId: string | undefined;
  legalContactEmail: string | undefined;
  legalContactUrl: string | undefined;
  firebaseApiKey: string | undefined;
  firebaseAuthDomain: string | undefined;
  firebaseProjectId: string | undefined;
  firebaseStorageBucket: string | undefined;
  firebaseMessagingSenderId: string | undefined;
  firebaseAppId: string | undefined;
};

export type EnvSource = {
  VITE_APP_NAME?: string;
  VITE_APP_STORE_URL?: string;
  VITE_PLAY_STORE_URL?: string;
  VITE_PUBLIC_SITE_URL?: string;
  VITE_API_BASE_URL?: string;
  VITE_GA_MEASUREMENT_ID?: string;
  VITE_META_PIXEL_ID?: string;
  VITE_LEGAL_CONTACT_EMAIL?: string;
  VITE_LEGAL_CONTACT_URL?: string;
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_STORAGE_BUCKET?: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
};

export const FIREBASE_WEB_ENV_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

export const MISSING_FIREBASE_WEB_CONFIG_MESSAGE =
  "Missing Firebase web config. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, and VITE_FIREBASE_APP_ID.";

const DEFAULT_APP_NAME = "Pocket Closet";

const readOptionalEnv = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return undefined;
  }

  return trimmedValue;
};

const readOptionalOrigin = (value: string | undefined): string | undefined => {
  const trimmedValue = readOptionalEnv(value);
  if (!trimmedValue) {
    return undefined;
  }

  return trimmedValue.replace(/\/+$/, "");
};

export const getPublicAppEnv = (
  source: EnvSource = import.meta.env,
): PublicAppEnv => {
  return {
    appName: readOptionalEnv(source.VITE_APP_NAME) ?? DEFAULT_APP_NAME,
    appStoreUrl: readOptionalEnv(source.VITE_APP_STORE_URL),
    playStoreUrl: readOptionalEnv(source.VITE_PLAY_STORE_URL),
    publicSiteUrl: readOptionalOrigin(source.VITE_PUBLIC_SITE_URL),
    apiBaseUrl: readOptionalOrigin(source.VITE_API_BASE_URL),
    gaMeasurementId: readOptionalEnv(source.VITE_GA_MEASUREMENT_ID),
    metaPixelId: readOptionalEnv(source.VITE_META_PIXEL_ID),
    legalContactEmail: readOptionalEnv(source.VITE_LEGAL_CONTACT_EMAIL),
    legalContactUrl: readOptionalEnv(source.VITE_LEGAL_CONTACT_URL),
    firebaseApiKey: readOptionalEnv(source.VITE_FIREBASE_API_KEY),
    firebaseAuthDomain: readOptionalEnv(source.VITE_FIREBASE_AUTH_DOMAIN),
    firebaseProjectId: readOptionalEnv(source.VITE_FIREBASE_PROJECT_ID),
    firebaseStorageBucket: readOptionalEnv(source.VITE_FIREBASE_STORAGE_BUCKET),
    firebaseMessagingSenderId: readOptionalEnv(
      source.VITE_FIREBASE_MESSAGING_SENDER_ID,
    ),
    firebaseAppId: readOptionalEnv(source.VITE_FIREBASE_APP_ID),
  };
};

export const getFirebaseWebConfig = (
  source: EnvSource = import.meta.env,
): FirebaseWebConfig => {
  const apiKey = readOptionalEnv(source.VITE_FIREBASE_API_KEY);
  const authDomain = readOptionalEnv(source.VITE_FIREBASE_AUTH_DOMAIN);
  const projectId = readOptionalEnv(source.VITE_FIREBASE_PROJECT_ID);
  const storageBucket = readOptionalEnv(source.VITE_FIREBASE_STORAGE_BUCKET);
  const messagingSenderId = readOptionalEnv(
    source.VITE_FIREBASE_MESSAGING_SENDER_ID,
  );
  const appId = readOptionalEnv(source.VITE_FIREBASE_APP_ID);

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    throw new Error(MISSING_FIREBASE_WEB_CONFIG_MESSAGE);
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
};

export const hasFirebaseWebConfig = (
  source: EnvSource = import.meta.env,
): boolean => {
  try {
    getFirebaseWebConfig(source);
    return true;
  } catch {
    return false;
  }
};
