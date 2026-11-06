export {};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      (...args: unknown[]): unknown;
      track?: (...args: unknown[]) => void;
      page?: (...args: unknown[]) => void;
      load?: (...args: unknown[]) => void;
      identify?: (payload: Record<string, unknown>) => void;
    };
    __WARDROBE_E2E_TRACKING_IDS__?: {
      gaMeasurementId?: string;
      metaPixelId?: string;
      tiktokPixelId?: string;
    };
    __WARDROBE_TRACKING_CALLS__?: {
      gtag: unknown[][];
      fbq: unknown[][];
      ttq: unknown[][];
    };
  }
}
