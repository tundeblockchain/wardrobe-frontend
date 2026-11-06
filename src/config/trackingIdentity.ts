import { getPublicAppEnv } from "./env";
import {
  canTrackMetaPixel,
  canTrackTikTokPixel,
  isMetaPixelLoaded,
  isTikTokIdentifyLoaded,
  type TrackingIds,
} from "./tracking";

const toSha256Hex = (buffer: ArrayBuffer): string => {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const resolveIdentityIds = (ids?: Partial<TrackingIds>): TrackingIds => {
  if (ids) {
    return {
      gaMeasurementId: ids.gaMeasurementId,
      metaPixelId: ids.metaPixelId,
      tiktokPixelId: ids.tiktokPixelId,
    };
  }

  const env = getPublicAppEnv();
  return {
    gaMeasurementId: env.gaMeasurementId,
    metaPixelId: env.metaPixelId,
    tiktokPixelId: env.tiktokPixelId,
  };
};

export const hashExternalId = async (
  uid: string,
): Promise<string | undefined> => {
  const value = uid.trim();
  if (!value) {
    return undefined;
  }

  if (typeof crypto === "undefined" || !crypto.subtle) {
    return undefined;
  }

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return toSha256Hex(digest);
};

export const applyTrackingExternalId = (
  hashedExternalId: string,
  ids?: Partial<TrackingIds>,
): void => {
  const hash = hashedExternalId.trim();
  if (!hash) {
    return;
  }

  const resolved = resolveIdentityIds(ids);
  const payload = { external_id: hash };

  if (
    canTrackMetaPixel(resolved.metaPixelId) &&
    isMetaPixelLoaded() &&
    window.fbq
  ) {
    window.fbq("init", resolved.metaPixelId, payload);
  }

  if (
    canTrackTikTokPixel(resolved.tiktokPixelId) &&
    isTikTokIdentifyLoaded() &&
    window.ttq?.identify
  ) {
    window.ttq.identify(payload);
  }
};

export const clearTrackingExternalId = (ids?: Partial<TrackingIds>): void => {
  const resolved = resolveIdentityIds(ids);

  if (
    canTrackMetaPixel(resolved.metaPixelId) &&
    isMetaPixelLoaded() &&
    window.fbq
  ) {
    window.fbq("init", resolved.metaPixelId);
  }
};
