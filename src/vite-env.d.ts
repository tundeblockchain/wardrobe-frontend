/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_STORE_URL?: string;
  readonly VITE_PLAY_STORE_URL?: string;
  readonly VITE_PUBLIC_SITE_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
  readonly VITE_META_PIXEL_ID?: string;
  readonly VITE_LEGAL_CONTACT_EMAIL?: string;
  readonly VITE_LEGAL_CONTACT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.html?raw" {
  const html: string;
  export default html;
}
