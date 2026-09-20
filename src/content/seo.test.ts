import { describe, expect, it } from "vitest";
import { getPublicAppEnv } from "../config/env";
import {
  DEFAULT_LANDING_DESCRIPTION,
  DEFAULT_LANDING_TITLE,
  getDocumentMetaTags,
  getPageSeo,
  upsertJsonLdScript,
} from "./seo";
import { featureItems } from "./featureItems";
import { wardrobePalette } from "../theme/wardrobePalette";

const exampleEnv = getPublicAppEnv({
  VITE_APP_NAME: "Pocket Closet",
  VITE_PUBLIC_SITE_URL: "https://example.com",
  VITE_APP_STORE_URL: "https://apps.apple.com/app/id000000000",
  VITE_PLAY_STORE_URL:
    "https://play.google.com/store/apps/details?id=com.example.wardrobe",
});

const jsonLdText = (jsonLd: unknown) => JSON.stringify(jsonLd);

describe("getPageSeo", () => {
  it("describes the landing as a software product without invented ratings", () => {
    const pageSeo = getPageSeo({
      pathname: "/",
      env: exampleEnv,
    });
    const serialized = jsonLdText(pageSeo.jsonLd);

    expect(DEFAULT_LANDING_TITLE).toBe(
      "Pocket Closet — organize, outfit, and try on your closet",
    );
    expect(DEFAULT_LANDING_DESCRIPTION).toMatch(/^Pocket Closet /);
    expect(pageSeo.title).toBe(DEFAULT_LANDING_TITLE);
    expect(pageSeo.description).toBe(DEFAULT_LANDING_DESCRIPTION);
    expect(pageSeo.siteName).toBe("Pocket Closet");
    expect(pageSeo.canonicalUrl).toBe("https://example.com/");
    expect(pageSeo.ogImageUrl).toBe("https://example.com/og-image.png");
    expect(serialized).toContain("SoftwareApplication");
    expect(serialized).toContain("WebSite");
    expect(serialized).toContain("LifestyleApplication");
    expect(serialized).toContain("iOS, Android");
    expect(serialized).toContain("installUrl");
    featureItems.forEach((featureItem) => {
      expect(serialized).toContain(featureItem.title);
    });
    expect(serialized).not.toMatch(/aggregateRating|ratingValue|reviewCount/);
    expect(serialized).not.toContain('"review"');
    expect(serialized).not.toContain("InStock");
    expect(serialized).not.toContain("Offer");
  });

  it("omits absolute URLs and store install links when those values are unset", () => {
    const pageSeo = getPageSeo({
      pathname: "/",
      env: getPublicAppEnv({}),
    });
    const serialized = jsonLdText(pageSeo.jsonLd);

    expect(pageSeo.canonicalUrl).toBeUndefined();
    expect(pageSeo.ogImageUrl).toBeUndefined();
    expect(serialized).not.toContain("installUrl");
    expect(serialized).not.toContain("example.com");
    expect(serialized).not.toContain("apps.apple.com");
    expect(serialized).toContain("SoftwareApplication");
  });

  it("uses WebPage structured data for legal routes", () => {
    const termsSeo = getPageSeo({
      pathname: "/terms",
      env: exampleEnv,
    });
    const privacySeo = getPageSeo({
      pathname: "/privacy",
      env: exampleEnv,
    });

    expect(termsSeo.title).toContain("Terms of Service");
    expect(privacySeo.title).toContain("Privacy Policy");
    expect(termsSeo.canonicalUrl).toBe("https://example.com/terms");
    expect(privacySeo.canonicalUrl).toBe("https://example.com/privacy");
    expect(jsonLdText(termsSeo.jsonLd)).toContain("WebPage");
    expect(jsonLdText(privacySeo.jsonLd)).toContain("WebPage");
    expect(jsonLdText(termsSeo.jsonLd)).not.toContain("SoftwareApplication");
    expect(jsonLdText(termsSeo.jsonLd)).not.toMatch(/aggregateRating|ratingValue/);
  });

  it("uses share-friendly title and OG image when a preview is loaded", () => {
    const pageSeo = getPageSeo({
      pathname: "/share/shr_abcdefghijklmnopqrstu",
      env: exampleEnv,
      sharePreview: {
        resourceType: "ITEM",
        title: "Black T-Shirt",
        imageUrl: "https://cdn.example.com/item.jpg",
        expiresAt: "2026-10-19T12:00:00.000Z",
      },
    });
    const tags = getDocumentMetaTags(pageSeo);
    const byKey = Object.fromEntries(tags.map((tag) => [tag.key, tag.content]));

    expect(pageSeo.title).toBe("Black T-Shirt — Pocket Closet");
    expect(pageSeo.canonicalUrl).toBe(
      "https://example.com/share/shr_abcdefghijklmnopqrstu",
    );
    expect(pageSeo.robots).toBe("index,follow");
    expect(byKey["og:title"]).toBe("Black T-Shirt — Pocket Closet");
    expect(byKey["og:image"]).toBe("https://cdn.example.com/item.jpg");
    expect(jsonLdText(pageSeo.jsonLd)).toContain("WebPage");
    expect(jsonLdText(pageSeo.jsonLd)).toContain("ImageObject");
    expect(jsonLdText(pageSeo.jsonLd)).toContain("Black T-Shirt");
  });

  it("marks missing or expired share previews as noindex", () => {
    const missingSeo = getPageSeo({
      pathname: "/share/shr_missingtoken0000001",
      env: exampleEnv,
      shareErrorKind: "not_found",
    });
    const goneSeo = getPageSeo({
      pathname: "/share/shr_expiredtoken00000001",
      env: exampleEnv,
      shareErrorKind: "gone",
    });

    expect(missingSeo.title).toContain("isn't available");
    expect(missingSeo.robots).toBe("noindex,follow");
    expect(goneSeo.title).toContain("expired");
    expect(goneSeo.robots).toBe("noindex,follow");
    expect(goneSeo.ogImageUrl).toBe("https://example.com/og-image.png");
  });
});

describe("getDocumentMetaTags", () => {
  it("includes Open Graph and Twitter tags when a public site URL is set", () => {
    const pageSeo = getPageSeo({
      pathname: "/",
      env: exampleEnv,
    });
    const tags = getDocumentMetaTags(pageSeo);
    const byKey = Object.fromEntries(tags.map((tag) => [tag.key, tag.content]));

    expect(byKey.description).toBe(DEFAULT_LANDING_DESCRIPTION);
    expect(byKey["theme-color"]).toBe(wardrobePalette.themeColor);
    expect(byKey["og:title"]).toBe(DEFAULT_LANDING_TITLE);
    expect(byKey["og:type"]).toBe("website");
    expect(byKey["og:url"]).toBe("https://example.com/");
    expect(byKey["og:image"]).toBe("https://example.com/og-image.png");
    expect(byKey["twitter:card"]).toBe("summary_large_image");
    expect(byKey["twitter:image"]).toBe("https://example.com/og-image.png");
  });

  it("omits canonical social URLs when the public site URL is unknown", () => {
    const pageSeo = getPageSeo({
      pathname: "/",
      env: getPublicAppEnv({}),
    });
    const tags = getDocumentMetaTags(pageSeo);
    const keys = tags.map((tag) => tag.key);

    expect(keys).not.toContain("og:url");
    expect(keys).not.toContain("og:image");
    expect(keys).not.toContain("twitter:image");
    expect(keys).toContain("og:title");
    expect(keys).toContain("twitter:card");
  });
});

describe("upsertJsonLdScript", () => {
  it("writes JSON-LD once and replaces it on update", () => {
    const doc = document.implementation.createHTMLDocument("json-ld");
    const first = getPageSeo({ pathname: "/", env: exampleEnv }).jsonLd;
    const second = getPageSeo({ pathname: "/privacy", env: exampleEnv }).jsonLd;

    upsertJsonLdScript(doc, first);
    expect(doc.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(
      1,
    );
    expect(doc.getElementById("wardrobe-json-ld")?.textContent).toContain(
      "SoftwareApplication",
    );

    upsertJsonLdScript(doc, second);
    expect(doc.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(
      1,
    );
    expect(doc.getElementById("wardrobe-json-ld")?.textContent).toContain("WebPage");
    expect(doc.getElementById("wardrobe-json-ld")?.textContent).not.toContain(
      "SoftwareApplication",
    );
  });
});
