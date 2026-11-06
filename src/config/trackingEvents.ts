import { getPublicAppEnv } from "./env";
import {
  canTrackGoogleAnalytics,
  canTrackMetaPixel,
  canTrackTikTokPixel,
  sendGoogleAnalyticsEvent,
  sendMetaPixelEvent,
  sendTikTokPixelEvent,
  STORE_CTA_GA_EVENT,
  STORE_CTA_META_EVENT,
  STORE_CTA_TIKTOK_EVENT,
  type StoreCtaClickPayload,
  type StoreCtaClickResult,
  type TrackingIds,
  type TrackingInstallResult,
  type TrackingTestCodes,
} from "./tracking";
import { getTrackingPageTitle, toTrackingPath } from "./trackingPath";

export const CHECKOUT_SUCCESS_STORAGE_KEY =
  "wardrobe.tracking.checkoutSuccessIds";
export const STRIPE_EVENT_ID_PREFIX = "stripe_";
export const MISSING_CHECKOUT_SESSION_KEY = "missing-session-id";

const BLOCKED_PARAM_KEY_PATTERN =
  /email|(^|_)name$|user_id|\buid\b|item_id|wardrobe_id|outfit_id|wish_id|search_term|^query$|\burl\b|href|page_location|phone|address|session_id/i;
const EMAIL_VALUE_PATTERN = /[^@\s]+@[^@\s]+\.[^@\s]+/;
const ID_VALUE_PATTERN =
  /^(wd_|item_|outfit_|wish_|usr_|user-|cs_)[A-Za-z0-9_-]+$/i;

export type TrackingEventName =
  | "page_view"
  | "store_cta_click"
  | "sign_up"
  | "login"
  | "logout"
  | "contact"
  | "view_pricing"
  | "create_wardrobe"
  | "rename_wardrobe"
  | "delete_wardrobe"
  | "add_item"
  | "edit_item"
  | "delete_item"
  | "item_image_uploaded"
  | "view_item"
  | "save_outfit"
  | "delete_outfit"
  | "view_recommendations"
  | "add_to_wishlist"
  | "wishlist_mark_owned"
  | "delete_wishlist_item"
  | "search"
  | "paywall_shown"
  | "limit_hit"
  | "settings_change"
  | "share"
  | "initiate_checkout"
  | "subscribe"
  | "start_trial";

export type VendorEventMapping = {
  name: string;
  standard: boolean;
};

export type TrackingEventMapping = {
  ga: string;
  meta: VendorEventMapping;
  tiktok: VendorEventMapping;
};

export const TRACKING_EVENT_MAP: Record<
  TrackingEventName,
  TrackingEventMapping
> = {
  page_view: {
    ga: "page_view",
    meta: { name: "PageView", standard: true },
    tiktok: { name: "PageView", standard: true },
  },
  store_cta_click: {
    ga: STORE_CTA_GA_EVENT,
    meta: { name: STORE_CTA_META_EVENT, standard: false },
    tiktok: { name: STORE_CTA_TIKTOK_EVENT, standard: true },
  },
  sign_up: {
    ga: "sign_up",
    meta: { name: "CompleteRegistration", standard: true },
    tiktok: { name: "CompleteRegistration", standard: true },
  },
  login: {
    ga: "login",
    meta: { name: "Login", standard: false },
    tiktok: { name: "Login", standard: false },
  },
  logout: {
    ga: "logout",
    meta: { name: "Logout", standard: false },
    tiktok: { name: "Logout", standard: false },
  },
  contact: {
    ga: "generate_lead",
    meta: { name: "Contact", standard: true },
    tiktok: { name: "Contact", standard: true },
  },
  view_pricing: {
    ga: "view_content",
    meta: { name: "ViewContent", standard: true },
    tiktok: { name: "ViewContent", standard: true },
  },
  create_wardrobe: {
    ga: "create_wardrobe",
    meta: { name: "CreateWardrobe", standard: false },
    tiktok: { name: "CreateWardrobe", standard: false },
  },
  rename_wardrobe: {
    ga: "rename_wardrobe",
    meta: { name: "RenameWardrobe", standard: false },
    tiktok: { name: "RenameWardrobe", standard: false },
  },
  delete_wardrobe: {
    ga: "delete_wardrobe",
    meta: { name: "DeleteWardrobe", standard: false },
    tiktok: { name: "DeleteWardrobe", standard: false },
  },
  add_item: {
    ga: "add_item",
    meta: { name: "AddItem", standard: false },
    tiktok: { name: "AddItem", standard: false },
  },
  edit_item: {
    ga: "edit_item",
    meta: { name: "EditItem", standard: false },
    tiktok: { name: "EditItem", standard: false },
  },
  delete_item: {
    ga: "delete_item",
    meta: { name: "DeleteItem", standard: false },
    tiktok: { name: "DeleteItem", standard: false },
  },
  item_image_uploaded: {
    ga: "item_image_uploaded",
    meta: { name: "ItemImageUploaded", standard: false },
    tiktok: { name: "ItemImageUploaded", standard: false },
  },
  view_item: {
    ga: "view_item",
    meta: { name: "ViewContent", standard: true },
    tiktok: { name: "ViewContent", standard: true },
  },
  save_outfit: {
    ga: "save_outfit",
    meta: { name: "SaveOutfit", standard: false },
    tiktok: { name: "SaveOutfit", standard: false },
  },
  delete_outfit: {
    ga: "delete_outfit",
    meta: { name: "DeleteOutfit", standard: false },
    tiktok: { name: "DeleteOutfit", standard: false },
  },
  view_recommendations: {
    ga: "view_recommendations",
    meta: { name: "ViewContent", standard: true },
    tiktok: { name: "ViewContent", standard: true },
  },
  add_to_wishlist: {
    ga: "add_to_wishlist",
    meta: { name: "AddToWishlist", standard: true },
    tiktok: { name: "AddToWishlist", standard: true },
  },
  wishlist_mark_owned: {
    ga: "wishlist_mark_owned",
    meta: { name: "WishlistMarkOwned", standard: false },
    tiktok: { name: "WishlistMarkOwned", standard: false },
  },
  delete_wishlist_item: {
    ga: "delete_wishlist_item",
    meta: { name: "DeleteWishlistItem", standard: false },
    tiktok: { name: "DeleteWishlistItem", standard: false },
  },
  search: {
    ga: "search",
    meta: { name: "Search", standard: true },
    tiktok: { name: "Search", standard: true },
  },
  paywall_shown: {
    ga: "paywall_shown",
    meta: { name: "PaywallShown", standard: false },
    tiktok: { name: "PaywallShown", standard: false },
  },
  limit_hit: {
    ga: "limit_hit",
    meta: { name: "LimitHit", standard: false },
    tiktok: { name: "LimitHit", standard: false },
  },
  settings_change: {
    ga: "settings_change",
    meta: { name: "SettingsChange", standard: false },
    tiktok: { name: "SettingsChange", standard: false },
  },
  share: {
    ga: "share",
    meta: { name: "Share", standard: false },
    tiktok: { name: "Share", standard: false },
  },
  initiate_checkout: {
    ga: "begin_checkout",
    meta: { name: "InitiateCheckout", standard: true },
    tiktok: { name: "InitiateCheckout", standard: true },
  },
  subscribe: {
    ga: "subscribe",
    meta: { name: "Subscribe", standard: true },
    tiktok: { name: "Subscribe", standard: true },
  },
  start_trial: {
    ga: "start_trial",
    meta: { name: "StartTrial", standard: true },
    tiktok: { name: "StartTrial", standard: true },
  },
};

export type TrackingParamValue = string | number | boolean;

export type TrackingParams = Record<string, TrackingParamValue>;

export type TrackEventOptions = {
  ids?: Partial<TrackingIds>;
  eventId?: string | null;
  testCodes?: TrackingTestCodes;
};

export type TrackEventResult = TrackingInstallResult & {
  eventId?: string;
};

const TRUE_ENV_VALUES = new Set(["true", "1"]);

export const createEventId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

export const isStripeCheckoutSessionId = (
  value: string | null | undefined,
): value is string => {
  if (!value) {
    return false;
  }

  return /^cs_(test_)?[A-Za-z0-9]+$/.test(value.trim());
};

export const toStripeEventId = (sessionId: string): string => {
  return `${STRIPE_EVENT_ID_PREFIX}${sessionId}`;
};

export const readCheckoutSessionId = (
  search: string,
): string | undefined => {
  const trimmed = search.startsWith("?") ? search.slice(1) : search;
  if (!trimmed) {
    return undefined;
  }

  const sessionId = new URLSearchParams(trimmed).get("session_id");
  if (!isStripeCheckoutSessionId(sessionId)) {
    return undefined;
  }

  return sessionId.trim();
};

export const isTrackingDebugEnabled = (
  source: { DEV?: boolean; VITE_TRACKING_DEBUG?: string } = import.meta.env,
): boolean => {
  if (source.DEV) {
    return true;
  }

  const debugValue = source.VITE_TRACKING_DEBUG?.trim().toLowerCase();
  return Boolean(debugValue && TRUE_ENV_VALUES.has(debugValue));
};

const toTrackingIds = (ids: Partial<TrackingIds>): TrackingIds => {
  return {
    gaMeasurementId: ids.gaMeasurementId,
    metaPixelId: ids.metaPixelId,
    tiktokPixelId: ids.tiktokPixelId,
  };
};

const hasValidTrackingId = (ids?: Partial<TrackingIds>): boolean => {
  if (!ids) {
    return false;
  }

  return (
    canTrackGoogleAnalytics(ids.gaMeasurementId) ||
    canTrackMetaPixel(ids.metaPixelId) ||
    canTrackTikTokPixel(ids.tiktokPixelId)
  );
};

const readE2eTrackingIds = (): TrackingIds | undefined => {
  if (import.meta.env.MODE !== "e2e" || typeof window === "undefined") {
    return undefined;
  }

  return window.__WARDROBE_E2E_TRACKING_IDS__;
};

export const resolveTrackingIds = (
  ids?: Partial<TrackingIds>,
): TrackingIds => {
  if (hasValidTrackingId(ids) && ids) {
    return toTrackingIds(ids);
  }

  const e2eIds = readE2eTrackingIds();
  if (hasValidTrackingId(e2eIds) && e2eIds) {
    return toTrackingIds(e2eIds);
  }

  if (ids) {
    return toTrackingIds(ids);
  }

  const env = getPublicAppEnv();
  return {
    gaMeasurementId: env.gaMeasurementId,
    metaPixelId: env.metaPixelId,
    tiktokPixelId: env.tiktokPixelId,
  };
};

export const resolveTrackingTestCodes = (
  testCodes?: TrackingTestCodes,
): TrackingTestCodes => {
  if (testCodes) {
    return testCodes;
  }

  const env = getPublicAppEnv();
  return {
    metaTestEventCode: env.metaTestEventCode,
    tiktokTestEventCode: env.tiktokTestEventCode,
  };
};

export const sanitizeTrackingParams = (
  params: TrackingParams | undefined,
): Record<string, TrackingParamValue> => {
  if (!params) {
    return {};
  }

  const sanitized: Record<string, TrackingParamValue> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (BLOCKED_PARAM_KEY_PATTERN.test(key)) {
      return;
    }

    if (typeof value === "string") {
      if (EMAIL_VALUE_PATTERN.test(value) || ID_VALUE_PATTERN.test(value)) {
        return;
      }
    }

    sanitized[key] = value;
  });

  return sanitized;
};

const emptyResult = (): TrackEventResult => {
  return {
    googleAnalytics: false,
    metaPixel: false,
    tiktokPixel: false,
  };
};

export const trackEvent = (
  name: TrackingEventName,
  params?: TrackingParams,
  options: TrackEventOptions = {},
): TrackEventResult => {
  const ids = resolveTrackingIds(options.ids);
  const gaMeasurementId = canTrackGoogleAnalytics(ids.gaMeasurementId)
    ? ids.gaMeasurementId
    : undefined;
  const metaPixelId = canTrackMetaPixel(ids.metaPixelId)
    ? ids.metaPixelId
    : undefined;
  const tiktokPixelId = canTrackTikTokPixel(ids.tiktokPixelId)
    ? ids.tiktokPixelId
    : undefined;

  if (!gaMeasurementId && !metaPixelId && !tiktokPixelId) {
    return emptyResult();
  }

  const mapping = TRACKING_EVENT_MAP[name];
  const sanitizedParams = sanitizeTrackingParams(params);
  const eventId =
    options.eventId === null
      ? undefined
      : (options.eventId ?? createEventId());
  const testCodes = resolveTrackingTestCodes(options.testCodes);
  const result: TrackEventResult = {
    ...emptyResult(),
    eventId,
  };
  const vendorOptions = eventId
    ? { eventId, testCodes }
    : { testCodes };

  if (gaMeasurementId) {
    result.googleAnalytics = sendGoogleAnalyticsEvent(
      mapping.ga,
      sanitizedParams,
    );
  }

  if (metaPixelId) {
    result.metaPixel = sendMetaPixelEvent(
      mapping.meta.name,
      sanitizedParams,
      vendorOptions,
      mapping.meta.standard,
    );
  }

  if (tiktokPixelId) {
    result.tiktokPixel = sendTikTokPixelEvent(
      mapping.tiktok.name,
      sanitizedParams,
      vendorOptions,
    );
  }

  if (isTrackingDebugEnabled()) {
    console.debug("[tracking]", name, {
      ga: mapping.ga,
      meta: mapping.meta.name,
      tiktok: mapping.tiktok.name,
      params: sanitizedParams,
      eventId,
      vendors: {
        googleAnalytics: result.googleAnalytics,
        metaPixel: result.metaPixel,
        tiktokPixel: result.tiktokPixel,
      },
    });
  }

  return result;
};

export const trackSpaPageView = (
  {
    pathname,
    search = "",
  }: {
    pathname: string;
    search?: string;
    title?: string;
  },
  options: TrackEventOptions = {},
): TrackEventResult => {
  const path = toTrackingPath(pathname, search);
  return trackEvent(
    "page_view",
    {
      page_path: path,
      page_title: getTrackingPageTitle(path),
    },
    options,
  );
};

export const trackStoreCtaClick = (
  payload: StoreCtaClickPayload,
  ids?: Partial<TrackingIds>,
): StoreCtaClickResult => {
  const result = trackEvent("store_cta_click", {
    store: payload.store,
    placement: payload.placement,
  }, { ids });

  return {
    googleAnalytics: result.googleAnalytics,
    metaPixel: result.metaPixel,
    tiktokPixel: result.tiktokPixel,
  };
};

const readFiredCheckoutIds = (
  storage: Storage | undefined,
): Set<string> => {
  if (!storage) {
    return new Set();
  }

  try {
    const raw = storage.getItem(CHECKOUT_SUCCESS_STORAGE_KEY);
    if (!raw) {
      return new Set();
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(
      parsed.filter((entry): entry is string => typeof entry === "string"),
    );
  } catch {
    return new Set();
  }
};

const writeFiredCheckoutIds = (
  storage: Storage | undefined,
  ids: Set<string>,
): void => {
  if (!storage) {
    return;
  }

  storage.setItem(CHECKOUT_SUCCESS_STORAGE_KEY, JSON.stringify([...ids]));
};

export type CheckoutSuccessSignal = {
  sessionId?: string | null;
  isTrial?: boolean;
  tier?: string;
  interval?: string;
};

export const trackCheckoutSuccess = (
  signal: CheckoutSuccessSignal,
  options: TrackEventOptions = {},
): TrackEventResult => {
  const sessionId = isStripeCheckoutSessionId(signal.sessionId)
    ? signal.sessionId.trim()
    : undefined;
  const eventId = sessionId ? toStripeEventId(sessionId) : null;
  const dedupeKey = sessionId ?? MISSING_CHECKOUT_SESSION_KEY;
  const storage =
    typeof window === "undefined" ? undefined : window.sessionStorage;
  const firedIds = readFiredCheckoutIds(storage);

  if (firedIds.has(dedupeKey)) {
    return emptyResult();
  }

  firedIds.add(dedupeKey);
  writeFiredCheckoutIds(storage, firedIds);

  const params: TrackingParams = {};
  if (signal.tier) {
    params.tier = signal.tier;
  }
  if (signal.interval) {
    params.interval = signal.interval;
  }

  return trackEvent(signal.isTrial ? "start_trial" : "subscribe", params, {
    ids: options.ids,
    testCodes: options.testCodes,
    eventId,
  });
};

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
};

const toUnixSeconds = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value > 1e12 ? Math.floor(value / 1000) : Math.floor(value);
  }

  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    const numeric = Number(trimmed);
    return numeric > 1e12 ? Math.floor(numeric / 1000) : numeric;
  }

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return undefined;
  }

  return Math.floor(parsed / 1000);
};

const hasFutureTrialEnd = (record: Record<string, unknown>): boolean => {
  const trialEnd = toUnixSeconds(record.trial_end ?? record.trialEnd);
  if (trialEnd === undefined) {
    return false;
  }

  return trialEnd > Math.floor(Date.now() / 1000);
};

const isTrialingStatus = (status: unknown): boolean => {
  if (typeof status !== "string") {
    return false;
  }

  const normalized = status.trim().toLowerCase();
  return normalized === "trialing" || normalized === "trial";
};

const isTrialRecord = (value: unknown): boolean => {
  const record = asRecord(value);
  if (!record) {
    return false;
  }

  if (record.trial === true || record.isTrial === true) {
    return true;
  }

  return isTrialingStatus(record.status) || hasFutureTrialEnd(record);
};

export const isPaidTierTrial = (value: unknown): boolean => {
  if (isTrialRecord(value)) {
    return true;
  }

  const record = asRecord(value);
  return isTrialRecord(record?.paidTier);
};
