import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicAppEnv } from "./env";
import {
  canTrackGoogleAnalytics,
  canTrackMetaPixel,
  GA_SCRIPT_HOST,
  getTrackingSnippets,
  installPublicTracking,
  isGaMeasurementId,
  isMetaPixelId,
  META_PIXEL_NOSCRIPT_HOST,
  META_PIXEL_SCRIPT_SRC,
  STORE_CTA_GA_EVENT,
  STORE_CTA_META_EVENT,
  trackStoreCtaClick,
} from "./tracking";

const serializeSnippets = (snippets: ReturnType<typeof getTrackingSnippets>) => {
  return JSON.stringify(snippets);
};

describe("tracking ID guards", () => {
  it("rejects missing, blank, and malformed Google Analytics IDs", () => {
    expect(isGaMeasurementId(undefined)).toBe(false);
    expect(isGaMeasurementId("")).toBe(false);
    expect(isGaMeasurementId("UA-123456-1")).toBe(false);
    expect(isGaMeasurementId("G-")).toBe(false);
    expect(isGaMeasurementId("G-XXXXXXXXXX")).toBe(true);
  });

  it("rejects missing, blank, and malformed Meta Pixel IDs", () => {
    expect(isMetaPixelId(undefined)).toBe(false);
    expect(isMetaPixelId("")).toBe(false);
    expect(isMetaPixelId("pixel")).toBe(false);
    expect(isMetaPixelId("1234567")).toBe(false);
    expect(isMetaPixelId("000000000000000")).toBe(true);
  });
});

describe("getTrackingSnippets", () => {
  it("returns no snippets when env IDs are unset", () => {
    const env = getPublicAppEnv({});
    const snippets = getTrackingSnippets(env);
    const serialized = serializeSnippets(snippets);

    expect(snippets).toEqual([]);
    expect(serialized).not.toContain("G-");
    expect(serialized).not.toContain(GA_SCRIPT_HOST);
    expect(serialized).not.toContain("gtag");
    expect(serialized).not.toContain(META_PIXEL_SCRIPT_SRC);
    expect(serialized).not.toContain(META_PIXEL_NOSCRIPT_HOST);
    expect(serialized).not.toContain("fbq");
    expect(serialized).not.toContain("000000000000000");
  });

  it("returns no snippets when env IDs are blank placeholders", () => {
    const env = getPublicAppEnv({
      VITE_GA_MEASUREMENT_ID: "   ",
      VITE_META_PIXEL_ID: "",
    });
    const snippets = getTrackingSnippets(env);

    expect(snippets).toEqual([]);
    expect(env.gaMeasurementId).toBeUndefined();
    expect(env.metaPixelId).toBeUndefined();
  });

  it("returns no snippets for invalid public identifiers", () => {
    const snippets = getTrackingSnippets({
      gaMeasurementId: "not-a-ga-id",
      metaPixelId: "abc",
    });
    const serialized = serializeSnippets(snippets);

    expect(snippets).toEqual([]);
    expect(serialized).not.toContain("not-a-ga-id");
    expect(serialized).not.toContain("abc");
    expect(serialized).not.toContain(GA_SCRIPT_HOST);
    expect(serialized).not.toContain(META_PIXEL_SCRIPT_SRC);
  });

  it("includes only Google Analytics snippets when a valid GA ID is set", () => {
    const snippets = getTrackingSnippets({
      gaMeasurementId: "G-XXXXXXXXXX",
      metaPixelId: undefined,
    });
    const serialized = serializeSnippets(snippets);

    expect(snippets.length).toBeGreaterThan(0);
    expect(serialized).toContain("G-XXXXXXXXXX");
    expect(serialized).toContain(GA_SCRIPT_HOST);
    expect(serialized).toContain("gtag");
    expect(serialized).not.toContain(META_PIXEL_SCRIPT_SRC);
    expect(serialized).not.toContain(META_PIXEL_NOSCRIPT_HOST);
    expect(serialized).not.toContain("fbq");
  });

  it("includes only Meta Pixel snippets when a valid pixel ID is set", () => {
    const snippets = getTrackingSnippets({
      gaMeasurementId: undefined,
      metaPixelId: "000000000000000",
    });
    const serialized = serializeSnippets(snippets);

    expect(snippets.length).toBeGreaterThan(0);
    expect(serialized).toContain("000000000000000");
    expect(serialized).toContain(META_PIXEL_SCRIPT_SRC);
    expect(serialized).toContain(META_PIXEL_NOSCRIPT_HOST);
    expect(serialized).toContain("fbq");
    expect(serialized).not.toContain(GA_SCRIPT_HOST);
    expect(serialized).not.toContain("G-");
    expect(serialized).not.toContain("gtag");
  });
});

describe("installPublicTracking", () => {
  it("does not inject scripts or pixel markup when IDs are unset", () => {
    const doc = document.implementation.createHTMLDocument("unset-tracking");
    const result = installPublicTracking(getPublicAppEnv({}), doc);
    const html = doc.documentElement.outerHTML;

    expect(result).toEqual({ googleAnalytics: false, metaPixel: false });
    expect(doc.head.querySelectorAll("script")).toHaveLength(0);
    expect(doc.body.querySelectorAll("script, noscript, img")).toHaveLength(0);
    expect(html).not.toContain(GA_SCRIPT_HOST);
    expect(html).not.toContain("gtag");
    expect(html).not.toContain(META_PIXEL_SCRIPT_SRC);
    expect(html).not.toContain(META_PIXEL_NOSCRIPT_HOST);
    expect(html).not.toContain("fbq");
    expect(html).not.toContain("G-");
    expect(html).not.toMatch(/\bid=\d{8,}/);
  });

  it("injects Google Analytics only when a valid measurement ID is provided", () => {
    const doc = document.implementation.createHTMLDocument("ga-only");
    const result = installPublicTracking(
      { gaMeasurementId: "G-XXXXXXXXXX", metaPixelId: undefined },
      doc,
    );
    const html = doc.documentElement.outerHTML;

    expect(result).toEqual({ googleAnalytics: true, metaPixel: false });
    expect(html).toContain(GA_SCRIPT_HOST);
    expect(html).toContain("G-XXXXXXXXXX");
    expect(html).toContain("gtag");
    expect(html).not.toContain(META_PIXEL_SCRIPT_SRC);
    expect(html).not.toContain(META_PIXEL_NOSCRIPT_HOST);
    expect(html).not.toContain("fbq");
  });

  it("injects Meta Pixel only when a valid pixel ID is provided", () => {
    const doc = document.implementation.createHTMLDocument("pixel-only");
    const result = installPublicTracking(
      { gaMeasurementId: undefined, metaPixelId: "000000000000000" },
      doc,
    );
    const html = doc.documentElement.outerHTML;

    expect(result).toEqual({ googleAnalytics: false, metaPixel: true });
    expect(html).toContain(META_PIXEL_SCRIPT_SRC);
    expect(html).toContain(META_PIXEL_NOSCRIPT_HOST);
    expect(html).toContain("000000000000000");
    expect(html).toContain("fbq");
    expect(html).not.toContain(GA_SCRIPT_HOST);
    expect(html).not.toContain("G-XXXXXXXXXX");
    expect(html).not.toContain("gtag");
  });
});

describe("store CTA click helpers", () => {
  afterEach(() => {
    delete window.gtag;
    delete window.fbq;
  });

  it("does not treat empty or invalid IDs as trackable", () => {
    expect(canTrackGoogleAnalytics(undefined)).toBe(false);
    expect(canTrackGoogleAnalytics("")).toBe(false);
    expect(canTrackGoogleAnalytics("not-a-ga-id")).toBe(false);
    expect(canTrackMetaPixel(undefined)).toBe(false);
    expect(canTrackMetaPixel("")).toBe(false);
    expect(canTrackMetaPixel("pixel")).toBe(false);
  });

  it("does not fire click events when IDs are empty", () => {
    window.gtag = vi.fn();
    window.fbq = vi.fn();

    const result = trackStoreCtaClick(
      { store: "appStore", placement: "hero" },
      getPublicAppEnv({}),
    );

    expect(result).toEqual({ googleAnalytics: false, metaPixel: false });
    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.fbq).not.toHaveBeenCalled();
  });

  it("does not fire click events when IDs are blank or malformed", () => {
    window.gtag = vi.fn();
    window.fbq = vi.fn();

    const blankResult = trackStoreCtaClick(
      { store: "playStore", placement: "download" },
      getPublicAppEnv({
        VITE_GA_MEASUREMENT_ID: "   ",
        VITE_META_PIXEL_ID: "",
      }),
    );
    const invalidResult = trackStoreCtaClick(
      { store: "playStore", placement: "download" },
      { gaMeasurementId: "UA-123456-1", metaPixelId: "abc" },
    );

    expect(blankResult).toEqual({ googleAnalytics: false, metaPixel: false });
    expect(invalidResult).toEqual({ googleAnalytics: false, metaPixel: false });
    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.fbq).not.toHaveBeenCalled();
  });

  it("does not fire click events when IDs are valid but vendor functions are missing", () => {
    const result = trackStoreCtaClick(
      { store: "appStore", placement: "hero" },
      { gaMeasurementId: "G-XXXXXXXXXX", metaPixelId: "000000000000000" },
    );

    expect(result).toEqual({ googleAnalytics: false, metaPixel: false });
    expect(window.gtag).toBeUndefined();
    expect(window.fbq).toBeUndefined();
  });

  it("fires only the Google Analytics store CTA event when a valid GA ID is set", () => {
    window.gtag = vi.fn();
    window.fbq = vi.fn();

    const result = trackStoreCtaClick(
      { store: "appStore", placement: "hero" },
      { gaMeasurementId: "G-XXXXXXXXXX", metaPixelId: undefined },
    );

    expect(result).toEqual({ googleAnalytics: true, metaPixel: false });
    expect(window.gtag).toHaveBeenCalledTimes(1);
    expect(window.gtag).toHaveBeenCalledWith("event", STORE_CTA_GA_EVENT, {
      store: "appStore",
      placement: "hero",
    });
    expect(window.fbq).not.toHaveBeenCalled();
  });

  it("fires only the Meta Pixel store CTA event when a valid pixel ID is set", () => {
    window.gtag = vi.fn();
    window.fbq = vi.fn();

    const result = trackStoreCtaClick(
      { store: "playStore", placement: "download" },
      { gaMeasurementId: undefined, metaPixelId: "000000000000000" },
    );

    expect(result).toEqual({ googleAnalytics: false, metaPixel: true });
    expect(window.fbq).toHaveBeenCalledTimes(1);
    expect(window.fbq).toHaveBeenCalledWith(
      "trackCustom",
      STORE_CTA_META_EVENT,
      {
        store: "playStore",
        placement: "download",
      },
    );
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("accepts share placement on store CTA click events", () => {
    window.gtag = vi.fn();
    window.fbq = vi.fn();

    const result = trackStoreCtaClick(
      { store: "appStore", placement: "share" },
      { gaMeasurementId: "G-XXXXXXXXXX", metaPixelId: "000000000000000" },
    );

    expect(result).toEqual({ googleAnalytics: true, metaPixel: true });
    expect(window.gtag).toHaveBeenCalledWith("event", STORE_CTA_GA_EVENT, {
      store: "appStore",
      placement: "share",
    });
    expect(window.fbq).toHaveBeenCalledWith(
      "trackCustom",
      STORE_CTA_META_EVENT,
      {
        store: "appStore",
        placement: "share",
      },
    );
  });

  it("never sends page_view or PageView from a store CTA click", () => {
    window.gtag = vi.fn();
    window.fbq = vi.fn();

    trackStoreCtaClick(
      { store: "appStore", placement: "download" },
      { gaMeasurementId: "G-XXXXXXXXXX", metaPixelId: "000000000000000" },
    );

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      STORE_CTA_GA_EVENT,
      expect.any(Object),
    );
    expect(window.fbq).toHaveBeenCalledWith(
      "trackCustom",
      STORE_CTA_META_EVENT,
      expect.any(Object),
    );
    expect(window.gtag).not.toHaveBeenCalledWith(
      "event",
      "page_view",
      expect.anything(),
    );
    expect(window.fbq).not.toHaveBeenCalledWith("track", "PageView");
  });
});
