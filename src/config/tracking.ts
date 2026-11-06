import type { PublicAppEnv } from "./env";
import type { StoreKind } from "./storeCtas";

export const GA_SCRIPT_HOST = "https://www.googletagmanager.com";
export const META_PIXEL_SCRIPT_SRC =
  "https://connect.facebook.net/en_US/fbevents.js";
export const META_PIXEL_NOSCRIPT_HOST = "https://www.facebook.com/tr";
export const TIKTOK_PIXEL_SCRIPT_SRC =
  "https://analytics.tiktok.com/i18n/pixel/events.js";

export const TRACKING_ATTR = "data-wardrobe-tracking";

export type TrackingVendor =
  | "google-analytics"
  | "meta-pixel"
  | "tiktok-pixel";

export type TrackingSnippet = {
  id: string;
  vendor: TrackingVendor;
  tagName: "script" | "noscript";
  src?: string;
  async?: boolean;
  inlineContent?: string;
  imgSrc?: string;
};

export type TrackingIds = Pick<
  PublicAppEnv,
  "gaMeasurementId" | "metaPixelId" | "tiktokPixelId"
>;

export type TrackingInstallResult = {
  googleAnalytics: boolean;
  metaPixel: boolean;
  tiktokPixel: boolean;
};

export const STORE_CTA_GA_EVENT = "store_cta_click";
export const STORE_CTA_META_EVENT = "StoreCtaClick";
export const STORE_CTA_TIKTOK_EVENT = "ClickButton";

export type StoreCtaPlacement = "hero" | "download" | "share";

export type StoreCtaClickPayload = {
  store: StoreKind;
  placement: StoreCtaPlacement;
};

export type StoreCtaClickResult = TrackingInstallResult;

export type GtagFunction = (...args: unknown[]) => void;

export type FbqFunction = (...args: unknown[]) => void;

export type TtqTrackFunction = (
  eventName: string,
  params?: Record<string, unknown>,
  options?: Record<string, unknown>,
) => void;

export type TtqIdentifyFunction = (
  payload: Record<string, unknown>,
) => void;

export type TtqFunction = {
  (...args: unknown[]): unknown;
  track?: TtqTrackFunction;
  page?: (...args: unknown[]) => void;
  load?: (...args: unknown[]) => void;
  identify?: TtqIdentifyFunction;
  instance?: (...args: unknown[]) => unknown;
};

export type TrackingTestCodes = {
  metaTestEventCode?: string;
  tiktokTestEventCode?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFunction;
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
    ttq?: TtqFunction;
    TikTokAnalyticsObject?: string;
    __WARDROBE_E2E_TRACKING_IDS__?: TrackingIds;
  }
}

const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;
const META_PIXEL_ID_PATTERN = /^\d{8,20}$/;
const TIKTOK_PIXEL_ID_PATTERN = /^[A-Za-z0-9]{8,32}$/;

export const isGaMeasurementId = (
  value: string | undefined,
): value is string => {
  if (!value) {
    return false;
  }

  return GA_MEASUREMENT_ID_PATTERN.test(value);
};

export const isMetaPixelId = (value: string | undefined): value is string => {
  if (!value) {
    return false;
  }

  return META_PIXEL_ID_PATTERN.test(value);
};

export const isTikTokPixelId = (value: string | undefined): value is string => {
  if (!value) {
    return false;
  }

  return TIKTOK_PIXEL_ID_PATTERN.test(value);
};

export const sanitizeGaMeasurementId = (
  value: string | undefined,
): string | undefined => {
  if (!isGaMeasurementId(value)) {
    return undefined;
  }

  return value;
};

export const sanitizeMetaPixelId = (
  value: string | undefined,
): string | undefined => {
  if (!isMetaPixelId(value)) {
    return undefined;
  }

  return value;
};

export const sanitizeTikTokPixelId = (
  value: string | undefined,
): string | undefined => {
  if (!isTikTokPixelId(value)) {
    return undefined;
  }

  return value;
};

const getGaSnippets = (measurementId: string): TrackingSnippet[] => {
  return [
    {
      id: "wardrobe-ga-src",
      vendor: "google-analytics",
      tagName: "script",
      src: `${GA_SCRIPT_HOST}/gtag/js?id=${encodeURIComponent(measurementId)}`,
      async: true,
    },
    {
      id: "wardrobe-ga-inline",
      vendor: "google-analytics",
      tagName: "script",
      inlineContent: [
        "window.dataLayer = window.dataLayer || [];",
        "function gtag(){window.dataLayer.push(arguments);}",
        "window.gtag = gtag;",
        "gtag('js', new Date());",
        `gtag('config', '${measurementId}', { send_page_view: false });`,
      ].join("\n"),
    },
  ];
};

const getMetaPixelSnippets = (pixelId: string): TrackingSnippet[] => {
  return [
    {
      id: "wardrobe-meta-inline",
      vendor: "meta-pixel",
      tagName: "script",
      inlineContent: [
        "if (!window.fbq) {",
        "  var fbq = function () {",
        "    if (fbq.callMethod) {",
        "      fbq.callMethod.apply(fbq, arguments);",
        "    } else {",
        "      fbq.queue.push(arguments);",
        "    }",
        "  };",
        "  window.fbq = fbq;",
        "  window._fbq = fbq;",
        "  fbq.push = fbq;",
        "  fbq.loaded = true;",
        "  fbq.version = '2.0';",
        "  fbq.queue = [];",
        "}",
        `window.fbq('init', '${pixelId}');`,
      ].join("\n"),
    },
    {
      id: "wardrobe-meta-src",
      vendor: "meta-pixel",
      tagName: "script",
      src: META_PIXEL_SCRIPT_SRC,
      async: true,
    },
    {
      id: "wardrobe-meta-noscript",
      vendor: "meta-pixel",
      tagName: "noscript",
      imgSrc: `${META_PIXEL_NOSCRIPT_HOST}?id=${encodeURIComponent(pixelId)}&ev=PageView&noscript=1`,
    },
  ];
};

const getTikTokPixelSnippets = (pixelId: string): TrackingSnippet[] => {
  return [
    {
      id: "wardrobe-tiktok-inline",
      vendor: "tiktok-pixel",
      tagName: "script",
      inlineContent: [
        "if (!window.ttq) {",
        "  window.TikTokAnalyticsObject = 'ttq';",
        "  var ttq = window.ttq = window.ttq || [];",
        "  ttq.methods = ['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];",
        "  ttq.setAndDefer = function (obj, method) {",
        "    obj[method] = function () {",
        "      obj.push([method].concat(Array.prototype.slice.call(arguments, 0)));",
        "    };",
        "  };",
        "  for (var i = 0; i < ttq.methods.length; i++) {",
        "    ttq.setAndDefer(ttq, ttq.methods[i]);",
        "  }",
        "  ttq.instance = function (id) {",
        "    var inst = ttq._i[id] || [];",
        "    for (var n = 0; n < ttq.methods.length; n++) {",
        "      ttq.setAndDefer(inst, ttq.methods[n]);",
        "    }",
        "    return inst;",
        "  };",
        "  ttq.load = function (id, options) {",
        `    var url = '${TIKTOK_PIXEL_SCRIPT_SRC}';`,
        "    ttq._i = ttq._i || {};",
        "    ttq._i[id] = [];",
        "    ttq._i[id]._u = url;",
        "    ttq._t = ttq._t || {};",
        "    ttq._t[id] = +new Date();",
        "    ttq._o = ttq._o || {};",
        "    ttq._o[id] = options || {};",
        "    var script = document.createElement('script');",
        "    script.type = 'text/javascript';",
        "    script.async = true;",
        "    script.src = url + '?sdkid=' + encodeURIComponent(id) + '&lib=ttq';",
        "    var first = document.getElementsByTagName('script')[0];",
        "    if (first && first.parentNode) {",
        "      first.parentNode.insertBefore(script, first);",
        "    } else {",
        "      document.head.appendChild(script);",
        "    }",
        "  };",
        "}",
        `window.ttq.load('${pixelId}');`,
        "window.ttq.page();",
      ].join("\n"),
    },
  ];
};

export const getTrackingSnippets = (ids: TrackingIds): TrackingSnippet[] => {
  const snippets: TrackingSnippet[] = [];
  const gaMeasurementId = sanitizeGaMeasurementId(ids.gaMeasurementId);
  const metaPixelId = sanitizeMetaPixelId(ids.metaPixelId);
  const tiktokPixelId = sanitizeTikTokPixelId(ids.tiktokPixelId);

  if (gaMeasurementId) {
    snippets.push(...getGaSnippets(gaMeasurementId));
  }

  if (metaPixelId) {
    snippets.push(...getMetaPixelSnippets(metaPixelId));
  }

  if (tiktokPixelId) {
    snippets.push(...getTikTokPixelSnippets(tiktokPixelId));
  }

  return snippets;
};

const appendSnippet = (doc: Document, snippet: TrackingSnippet): void => {
  if (doc.getElementById(snippet.id)) {
    return;
  }

  if (snippet.tagName === "noscript") {
    const noscript = doc.createElement("noscript");
    noscript.id = snippet.id;
    noscript.setAttribute(TRACKING_ATTR, snippet.vendor);

    if (snippet.imgSrc) {
      const img = doc.createElement("img");
      img.height = 1;
      img.width = 1;
      img.src = snippet.imgSrc;
      img.alt = "";
      img.setAttribute("style", "display:none");
      noscript.appendChild(img);
    }

    doc.body.appendChild(noscript);
    return;
  }

  const script = doc.createElement("script");
  script.id = snippet.id;
  script.setAttribute(TRACKING_ATTR, snippet.vendor);

  if (snippet.async) {
    script.async = true;
  }

  if (snippet.src) {
    script.src = snippet.src;
  }

  if (snippet.inlineContent) {
    script.text = snippet.inlineContent;
  }

  doc.head.appendChild(script);
};

export const installPublicTracking = (
  ids: TrackingIds,
  doc: Document = document,
): TrackingInstallResult => {
  const snippets = getTrackingSnippets(ids);
  snippets.forEach((snippet) => {
    appendSnippet(doc, snippet);
  });

  return {
    googleAnalytics: snippets.some(
      (snippet) => snippet.vendor === "google-analytics",
    ),
    metaPixel: snippets.some((snippet) => snippet.vendor === "meta-pixel"),
    tiktokPixel: snippets.some((snippet) => snippet.vendor === "tiktok-pixel"),
  };
};

export const canTrackGoogleAnalytics = (
  gaMeasurementId: string | undefined,
): boolean => {
  return isGaMeasurementId(gaMeasurementId);
};

export const canTrackMetaPixel = (metaPixelId: string | undefined): boolean => {
  return isMetaPixelId(metaPixelId);
};

export const canTrackTikTokPixel = (
  tiktokPixelId: string | undefined,
): boolean => {
  return isTikTokPixelId(tiktokPixelId);
};

export const isGoogleAnalyticsLoaded = (): boolean => {
  return typeof window.gtag === "function";
};

export const isMetaPixelLoaded = (): boolean => {
  return typeof window.fbq === "function";
};

export const isTikTokPixelLoaded = (): boolean => {
  return typeof window.ttq?.track === "function";
};

export const isTikTokIdentifyLoaded = (): boolean => {
  return typeof window.ttq?.identify === "function";
};

export type VendorEventOptions = {
  eventId?: string;
  testCodes?: TrackingTestCodes;
};

const buildVendorEventOptions = (
  eventIdKey: "eventID" | "event_id",
  options: VendorEventOptions,
  testEventCode: string | undefined,
): Record<string, string> | undefined => {
  const eventOptions: Record<string, string> = {};
  if (options.eventId) {
    eventOptions[eventIdKey] = options.eventId;
  }
  if (testEventCode) {
    eventOptions.test_event_code = testEventCode;
  }

  if (Object.keys(eventOptions).length === 0) {
    return undefined;
  }

  return eventOptions;
};

export const sendGoogleAnalyticsEvent = (
  eventName: string,
  params: Record<string, unknown>,
): boolean => {
  if (!isGoogleAnalyticsLoaded()) {
    return false;
  }

  window.gtag?.("event", eventName, params);
  return true;
};

export const sendMetaPixelEvent = (
  eventName: string,
  params: Record<string, unknown>,
  options: VendorEventOptions,
  standard: boolean,
): boolean => {
  if (!isMetaPixelLoaded() || !window.fbq) {
    return false;
  }

  const command = standard ? "track" : "trackCustom";
  const eventOptions = buildVendorEventOptions(
    "eventID",
    options,
    options.testCodes?.metaTestEventCode,
  );

  if (eventOptions) {
    window.fbq(command, eventName, params, eventOptions);
  } else {
    window.fbq(command, eventName, params);
  }
  return true;
};

export const sendTikTokPixelEvent = (
  eventName: string,
  params: Record<string, unknown>,
  options: VendorEventOptions,
): boolean => {
  if (!isTikTokPixelLoaded() || !window.ttq?.track) {
    return false;
  }

  const eventOptions = buildVendorEventOptions(
    "event_id",
    options,
    options.testCodes?.tiktokTestEventCode,
  );

  if (eventOptions) {
    window.ttq.track(eventName, params, eventOptions);
  } else {
    window.ttq.track(eventName, params);
  }
  return true;
};
