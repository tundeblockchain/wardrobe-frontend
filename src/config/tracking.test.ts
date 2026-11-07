import { afterEach, describe, expect, it, vi } from "vitest";
import { clearConsent, writeConsent } from "./consent";
import { getPublicAppEnv } from "./env";
import {
  applyConsentedTracking,
  canTrackGoogleAnalytics,
  canTrackMetaPixel,
  canTrackTikTokPixel,
  commitConsentChoice,
  GA_SCRIPT_HOST,
  getTrackingSnippets,
  GOOGLE_CONSENT_DEFAULT,
  installPublicTracking,
  isGaMeasurementId,
  isMetaPixelId,
  isTikTokPixelId,
  META_PIXEL_NOSCRIPT_HOST,
  META_PIXEL_SCRIPT_SRC,
  TIKTOK_PIXEL_SCRIPT_SRC,
} from "./tracking";

const serializeSnippets = (snippets: ReturnType<typeof getTrackingSnippets>) => {
  return JSON.stringify(snippets);
};

const VALID_TIKTOK_PIXEL_ID = "CXXXXXXXXXXXXXXXXX";

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

  it("rejects missing, blank, and malformed TikTok Pixel IDs", () => {
    expect(isTikTokPixelId(undefined)).toBe(false);
    expect(isTikTokPixelId("")).toBe(false);
    expect(isTikTokPixelId("pixel")).toBe(false);
    expect(isTikTokPixelId("short")).toBe(false);
    expect(isTikTokPixelId("not a pixel")).toBe(false);
    expect(isTikTokPixelId(VALID_TIKTOK_PIXEL_ID)).toBe(true);
  });

  it("does not treat empty or invalid IDs as trackable", () => {
    expect(canTrackGoogleAnalytics(undefined)).toBe(false);
    expect(canTrackGoogleAnalytics("")).toBe(false);
    expect(canTrackGoogleAnalytics("not-a-ga-id")).toBe(false);
    expect(canTrackMetaPixel(undefined)).toBe(false);
    expect(canTrackMetaPixel("")).toBe(false);
    expect(canTrackMetaPixel("pixel")).toBe(false);
    expect(canTrackTikTokPixel(undefined)).toBe(false);
    expect(canTrackTikTokPixel("")).toBe(false);
    expect(canTrackTikTokPixel("pixel")).toBe(false);
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
    expect(serialized).not.toContain(TIKTOK_PIXEL_SCRIPT_SRC);
    expect(serialized).not.toContain("ttq");
    expect(serialized).not.toContain("000000000000000");
  });

  it("returns no snippets when env IDs are blank placeholders", () => {
    const env = getPublicAppEnv({
      VITE_GA_MEASUREMENT_ID: "   ",
      VITE_META_PIXEL_ID: "",
      VITE_TIKTOK_PIXEL_ID: "  ",
    });
    const snippets = getTrackingSnippets(env);

    expect(snippets).toEqual([]);
    expect(env.gaMeasurementId).toBeUndefined();
    expect(env.metaPixelId).toBeUndefined();
    expect(env.tiktokPixelId).toBeUndefined();
  });

  it("returns no snippets for invalid public identifiers", () => {
    const snippets = getTrackingSnippets({
      gaMeasurementId: "not-a-ga-id",
      metaPixelId: "abc",
      tiktokPixelId: "nope",
    });
    const serialized = serializeSnippets(snippets);

    expect(snippets).toEqual([]);
    expect(serialized).not.toContain("not-a-ga-id");
    expect(serialized).not.toContain("abc");
    expect(serialized).not.toContain("nope");
    expect(serialized).not.toContain(GA_SCRIPT_HOST);
    expect(serialized).not.toContain(META_PIXEL_SCRIPT_SRC);
    expect(serialized).not.toContain(TIKTOK_PIXEL_SCRIPT_SRC);
  });

  it("includes only Google Analytics snippets when a valid GA ID is set", () => {
    const snippets = getTrackingSnippets({
      gaMeasurementId: "G-XXXXXXXXXX",
      metaPixelId: undefined,
      tiktokPixelId: undefined,
    });
    const serialized = serializeSnippets(snippets);

    expect(snippets.length).toBeGreaterThan(0);
    expect(serialized).toContain("G-XXXXXXXXXX");
    expect(serialized).toContain(GA_SCRIPT_HOST);
    expect(serialized).toContain("gtag");
    expect(serialized).toContain("'consent', 'default'");
    expect(serialized).toContain(GOOGLE_CONSENT_DEFAULT.ad_storage);
    expect(serialized).toContain(GOOGLE_CONSENT_DEFAULT.analytics_storage);
    expect(serialized).not.toContain(META_PIXEL_SCRIPT_SRC);
    expect(serialized).not.toContain(META_PIXEL_NOSCRIPT_HOST);
    expect(serialized).not.toContain("fbq");
    expect(serialized).not.toContain(TIKTOK_PIXEL_SCRIPT_SRC);
    expect(serialized).not.toContain("ttq");
  });

  it("includes only Meta Pixel snippets when a valid pixel ID is set", () => {
    const snippets = getTrackingSnippets({
      gaMeasurementId: undefined,
      metaPixelId: "000000000000000",
      tiktokPixelId: undefined,
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
    expect(serialized).not.toContain(TIKTOK_PIXEL_SCRIPT_SRC);
    expect(serialized).not.toContain("ttq.load");
  });

  it("includes only TikTok Pixel snippets when a valid pixel ID is set", () => {
    const snippets = getTrackingSnippets({
      gaMeasurementId: undefined,
      metaPixelId: undefined,
      tiktokPixelId: VALID_TIKTOK_PIXEL_ID,
    });
    const serialized = serializeSnippets(snippets);

    expect(snippets.length).toBeGreaterThan(0);
    expect(serialized).toContain(VALID_TIKTOK_PIXEL_ID);
    expect(serialized).toContain(TIKTOK_PIXEL_SCRIPT_SRC);
    expect(serialized).toContain("ttq.load");
    expect(serialized).toContain("ttq.page()");
    expect(serialized).not.toContain(GA_SCRIPT_HOST);
    expect(serialized).not.toContain(META_PIXEL_SCRIPT_SRC);
    expect(serialized).not.toContain("fbq");
  });

  it("omits GA snippets without analytics consent and pixels without marketing consent", () => {
    const ids = {
      gaMeasurementId: "G-XXXXXXXXXX",
      metaPixelId: "000000000000000",
      tiktokPixelId: VALID_TIKTOK_PIXEL_ID,
    };

    const analyticsOnly = serializeSnippets(
      getTrackingSnippets(ids, { analytics: true, marketing: false }),
    );
    const marketingOnly = serializeSnippets(
      getTrackingSnippets(ids, { analytics: false, marketing: true }),
    );
    const none = getTrackingSnippets(ids, {
      analytics: false,
      marketing: false,
    });

    expect(analyticsOnly).toContain(GA_SCRIPT_HOST);
    expect(analyticsOnly).not.toContain(META_PIXEL_SCRIPT_SRC);
    expect(analyticsOnly).not.toContain(TIKTOK_PIXEL_SCRIPT_SRC);
    expect(marketingOnly).not.toContain(GA_SCRIPT_HOST);
    expect(marketingOnly).toContain(META_PIXEL_SCRIPT_SRC);
    expect(marketingOnly).toContain(TIKTOK_PIXEL_SCRIPT_SRC);
    expect(none).toEqual([]);
  });
});

describe("installPublicTracking", () => {
  it("does not inject scripts or pixel markup when IDs are unset", () => {
    const doc = document.implementation.createHTMLDocument("unset-tracking");
    const result = installPublicTracking(getPublicAppEnv({}), doc);
    const html = doc.documentElement.outerHTML;

    expect(result).toEqual({
      googleAnalytics: false,
      metaPixel: false,
      tiktokPixel: false,
    });
    expect(doc.head.querySelectorAll("script")).toHaveLength(0);
    expect(doc.body.querySelectorAll("script, noscript, img")).toHaveLength(0);
    expect(html).not.toContain(GA_SCRIPT_HOST);
    expect(html).not.toContain("gtag");
    expect(html).not.toContain(META_PIXEL_SCRIPT_SRC);
    expect(html).not.toContain(META_PIXEL_NOSCRIPT_HOST);
    expect(html).not.toContain("fbq");
    expect(html).not.toContain(TIKTOK_PIXEL_SCRIPT_SRC);
    expect(html).not.toContain("ttq");
    expect(html).not.toContain("G-");
    expect(html).not.toMatch(/\bid=\d{8,}/);
  });

  it("injects Google Analytics only when a valid measurement ID is provided", () => {
    const doc = document.implementation.createHTMLDocument("ga-only");
    const result = installPublicTracking(
      {
        gaMeasurementId: "G-XXXXXXXXXX",
        metaPixelId: undefined,
        tiktokPixelId: undefined,
      },
      doc,
      { analytics: true, marketing: false },
    );
    const html = doc.documentElement.outerHTML;

    expect(result).toEqual({
      googleAnalytics: true,
      metaPixel: false,
      tiktokPixel: false,
    });
    expect(html).toContain(GA_SCRIPT_HOST);
    expect(html).toContain("G-XXXXXXXXXX");
    expect(html).toContain("gtag");
    expect(html).toContain("'consent', 'default'");
    expect(html).toContain('"analytics_storage":"denied"');
    expect(html).not.toContain(META_PIXEL_SCRIPT_SRC);
    expect(html).not.toContain(META_PIXEL_NOSCRIPT_HOST);
    expect(html).not.toContain("fbq");
    expect(html).not.toContain(TIKTOK_PIXEL_SCRIPT_SRC);
  });

  it("does not inject scripts when IDs are valid but consent is denied", () => {
    const doc = document.implementation.createHTMLDocument("denied");
    const result = installPublicTracking(
      {
        gaMeasurementId: "G-XXXXXXXXXX",
        metaPixelId: "000000000000000",
        tiktokPixelId: VALID_TIKTOK_PIXEL_ID,
      },
      doc,
    );
    const html = doc.documentElement.outerHTML;

    expect(result).toEqual({
      googleAnalytics: false,
      metaPixel: false,
      tiktokPixel: false,
    });
    expect(html).not.toContain(GA_SCRIPT_HOST);
    expect(html).not.toContain(META_PIXEL_SCRIPT_SRC);
    expect(html).not.toContain(TIKTOK_PIXEL_SCRIPT_SRC);
  });

  it("injects Meta Pixel only when a valid pixel ID is provided", () => {
    const doc = document.implementation.createHTMLDocument("pixel-only");
    const result = installPublicTracking(
      {
        gaMeasurementId: undefined,
        metaPixelId: "000000000000000",
        tiktokPixelId: undefined,
      },
      doc,
      { analytics: false, marketing: true },
    );
    const html = doc.documentElement.outerHTML;

    expect(result).toEqual({
      googleAnalytics: false,
      metaPixel: true,
      tiktokPixel: false,
    });
    expect(html).toContain(META_PIXEL_SCRIPT_SRC);
    expect(html).toContain(META_PIXEL_NOSCRIPT_HOST);
    expect(html).toContain("000000000000000");
    expect(html).toContain("fbq");
    expect(html).not.toContain(GA_SCRIPT_HOST);
    expect(html).not.toContain("G-XXXXXXXXXX");
    expect(html).not.toContain("gtag");
    expect(html).not.toContain(TIKTOK_PIXEL_SCRIPT_SRC);
  });

  it("injects TikTok Pixel only when a valid pixel ID is provided", () => {
    const doc = document.implementation.createHTMLDocument("tiktok-only");
    const result = installPublicTracking(
      {
        gaMeasurementId: undefined,
        metaPixelId: undefined,
        tiktokPixelId: VALID_TIKTOK_PIXEL_ID,
      },
      doc,
      { analytics: false, marketing: true },
    );
    const html = doc.documentElement.outerHTML;

    expect(result).toEqual({
      googleAnalytics: false,
      metaPixel: false,
      tiktokPixel: true,
    });
    expect(html).toContain(TIKTOK_PIXEL_SCRIPT_SRC);
    expect(html).toContain(VALID_TIKTOK_PIXEL_ID);
    expect(html).toContain("ttq.load");
    expect(html).toContain("ttq.page()");
    expect(html).not.toContain(GA_SCRIPT_HOST);
    expect(html).not.toContain(META_PIXEL_SCRIPT_SRC);
    expect(html).not.toContain("fbq");
  });
});

describe("commitConsentChoice", () => {
  const ALL_IDS = {
    gaMeasurementId: "G-XXXXXXXXXX",
    metaPixelId: "000000000000000",
    tiktokPixelId: VALID_TIKTOK_PIXEL_ID,
  };

  afterEach(() => {
    clearConsent();
  });

  it("installs consented scripts immediately without a reload", () => {
    const doc = document.implementation.createHTMLDocument("grant");
    const reload = vi.fn();

    const saved = commitConsentChoice(
      { analytics: true, marketing: true },
      ALL_IDS,
      { doc, reload },
    );

    expect(saved.analytics).toBe(true);
    expect(saved.marketing).toBe(true);
    expect(doc.documentElement.outerHTML).toContain(GA_SCRIPT_HOST);
    expect(doc.documentElement.outerHTML).toContain(META_PIXEL_SCRIPT_SRC);
    expect(doc.documentElement.outerHTML).toContain(TIKTOK_PIXEL_SCRIPT_SRC);
    expect(reload).not.toHaveBeenCalled();
  });

  it("reloads after withdrawal when scripts were already installed", () => {
    const doc = document.implementation.createHTMLDocument("withdraw");
    const reload = vi.fn();
    writeConsent({ analytics: true, marketing: true }, 1);
    applyConsentedTracking(ALL_IDS, { analytics: true, marketing: true }, doc);

    commitConsentChoice(
      { analytics: false, marketing: false },
      ALL_IDS,
      { doc, reload },
    );

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not reload when rejecting on a first visit with no scripts", () => {
    const doc = document.implementation.createHTMLDocument("first-reject");
    const reload = vi.fn();

    commitConsentChoice(
      { analytics: false, marketing: false },
      ALL_IDS,
      { doc, reload },
    );

    expect(reload).not.toHaveBeenCalled();
    expect(doc.head.querySelectorAll("script")).toHaveLength(0);
  });
});

