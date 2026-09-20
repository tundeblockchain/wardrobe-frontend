import { describe, expect, it } from "vitest";
import { getPublicAppEnv } from "./env";

describe("getPublicAppEnv", () => {
  it("uses the default app name when the env value is missing", () => {
    const env = getPublicAppEnv({});

    expect(env.appName).toBe("Pocket Closet");
    expect(env.appStoreUrl).toBeUndefined();
    expect(env.playStoreUrl).toBeUndefined();
    expect(env.publicSiteUrl).toBeUndefined();
    expect(env.apiBaseUrl).toBeUndefined();
    expect(env.gaMeasurementId).toBeUndefined();
    expect(env.metaPixelId).toBeUndefined();
    expect(env.legalContactEmail).toBeUndefined();
    expect(env.legalContactUrl).toBeUndefined();
  });

  it("treats blank placeholders as unset", () => {
    const env = getPublicAppEnv({
      VITE_APP_STORE_URL: "   ",
      VITE_PLAY_STORE_URL: "",
      VITE_PUBLIC_SITE_URL: "  ",
      VITE_API_BASE_URL: " ",
      VITE_GA_MEASUREMENT_ID: " \n",
      VITE_META_PIXEL_ID: "  ",
      VITE_LEGAL_CONTACT_EMAIL: "   ",
      VITE_LEGAL_CONTACT_URL: " ",
    });

    expect(env.appStoreUrl).toBeUndefined();
    expect(env.playStoreUrl).toBeUndefined();
    expect(env.publicSiteUrl).toBeUndefined();
    expect(env.apiBaseUrl).toBeUndefined();
    expect(env.gaMeasurementId).toBeUndefined();
    expect(env.metaPixelId).toBeUndefined();
    expect(env.legalContactEmail).toBeUndefined();
    expect(env.legalContactUrl).toBeUndefined();
  });

  it("trims configured public identifiers", () => {
    const env = getPublicAppEnv({
      VITE_APP_NAME: " Wardrobe ",
      VITE_APP_STORE_URL: " https://apps.apple.com/app/id000000000 ",
      VITE_PLAY_STORE_URL: " https://play.google.com/store/apps/details?id=com.example.wardrobe ",
      VITE_PUBLIC_SITE_URL: " https://example.com/ ",
      VITE_API_BASE_URL: " https://api.example.com/ ",
      VITE_GA_MEASUREMENT_ID: " G-XXXXXXXXXX ",
      VITE_META_PIXEL_ID: " 000000000000000 ",
      VITE_LEGAL_CONTACT_EMAIL: " legal@example.com ",
      VITE_LEGAL_CONTACT_URL: " https://example.com/contact ",
    });

    expect(env.appName).toBe("Wardrobe");
    expect(env.appStoreUrl).toBe("https://apps.apple.com/app/id000000000");
    expect(env.playStoreUrl).toBe(
      "https://play.google.com/store/apps/details?id=com.example.wardrobe",
    );
    expect(env.publicSiteUrl).toBe("https://example.com");
    expect(env.apiBaseUrl).toBe("https://api.example.com");
    expect(env.gaMeasurementId).toBe("G-XXXXXXXXXX");
    expect(env.metaPixelId).toBe("000000000000000");
    expect(env.legalContactEmail).toBe("legal@example.com");
    expect(env.legalContactUrl).toBe("https://example.com/contact");
  });
});
