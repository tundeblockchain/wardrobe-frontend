import type { PublicAppEnv } from "./env";

export const GA_SCRIPT_HOST = "https://www.googletagmanager.com";
export const META_PIXEL_SCRIPT_SRC =
  "https://connect.facebook.net/en_US/fbevents.js";
export const META_PIXEL_NOSCRIPT_HOST = "https://www.facebook.com/tr";

export const TRACKING_ATTR = "data-wardrobe-tracking";

export type TrackingVendor = "google-analytics" | "meta-pixel";

export type TrackingSnippet = {
  id: string;
  vendor: TrackingVendor;
  tagName: "script" | "noscript";
  src?: string;
  async?: boolean;
  inlineContent?: string;
  imgSrc?: string;
};

export type TrackingIds = Pick<PublicAppEnv, "gaMeasurementId" | "metaPixelId">;

export type TrackingInstallResult = {
  googleAnalytics: boolean;
  metaPixel: boolean;
};

export type GtagFunction = (...args: unknown[]) => void;

export type FbqFunction = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFunction;
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
  }
}

const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;
const META_PIXEL_ID_PATTERN = /^\d{8,20}$/;

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

export const getTrackingSnippets = (ids: TrackingIds): TrackingSnippet[] => {
  const snippets: TrackingSnippet[] = [];
  const gaMeasurementId = sanitizeGaMeasurementId(ids.gaMeasurementId);
  const metaPixelId = sanitizeMetaPixelId(ids.metaPixelId);

  if (gaMeasurementId) {
    snippets.push(...getGaSnippets(gaMeasurementId));
  }

  if (metaPixelId) {
    snippets.push(...getMetaPixelSnippets(metaPixelId));
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
  };
};

export const trackSpaPageView = ({
  path,
  title,
}: {
  path: string;
  title: string;
}): void => {
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      page_path: path,
      page_title: title,
    });
  }

  if (typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
};
