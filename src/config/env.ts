export type PublicAppEnv = {
  appName: string;
  appStoreUrl: string | undefined;
  playStoreUrl: string | undefined;
  gaMeasurementId: string | undefined;
  metaPixelId: string | undefined;
};

export type EnvSource = {
  VITE_APP_NAME?: string;
  VITE_APP_STORE_URL?: string;
  VITE_PLAY_STORE_URL?: string;
  VITE_GA_MEASUREMENT_ID?: string;
  VITE_META_PIXEL_ID?: string;
};

const DEFAULT_APP_NAME = "Digital Wardrobe";

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

export const getPublicAppEnv = (
  source: EnvSource = import.meta.env,
): PublicAppEnv => {
  return {
    appName: readOptionalEnv(source.VITE_APP_NAME) ?? DEFAULT_APP_NAME,
    appStoreUrl: readOptionalEnv(source.VITE_APP_STORE_URL),
    playStoreUrl: readOptionalEnv(source.VITE_PLAY_STORE_URL),
    gaMeasurementId: readOptionalEnv(source.VITE_GA_MEASUREMENT_ID),
    metaPixelId: readOptionalEnv(source.VITE_META_PIXEL_ID),
  };
};
