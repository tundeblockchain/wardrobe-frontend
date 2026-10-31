import { describe, expect, it } from "vitest";
import { DEFAULT_APP_STORE_URL } from "./env";
import {
  areStoreLinksPublished,
  getStoreCtas,
  isStoreCtaAvailable,
} from "./storeCtas";

describe("getStoreCtas", () => {
  it("uses the live App Store listing when the App Store URL is unset", () => {
    const storeCtas = getStoreCtas({
      appStoreUrl: undefined,
      playStoreUrl: undefined,
    });

    expect(storeCtas).toHaveLength(2);
    expect(storeCtas[0]?.kind).toBe("appStore");
    expect(storeCtas[0]?.href).toBe(DEFAULT_APP_STORE_URL);
    expect(storeCtas[0]?.comingSoonLabel).toBeUndefined();
    expect(isStoreCtaAvailable(storeCtas[0]!)).toBe(true);
    expect(storeCtas[1]?.kind).toBe("playStore");
    expect(storeCtas[1]?.href).toBeUndefined();
    expect(storeCtas[1]?.comingSoonLabel).toBe("Google Play — coming soon");
    expect(isStoreCtaAvailable(storeCtas[1]!)).toBe(false);
    expect(
      areStoreLinksPublished({
        appStoreUrl: undefined,
        playStoreUrl: undefined,
      }),
    ).toBe(true);
  });

  it("exposes hrefs when store URLs are configured", () => {
    const storeCtas = getStoreCtas({
      appStoreUrl: "https://apps.apple.com/app/id000000000",
      playStoreUrl: "https://play.google.com/store/apps/details?id=com.example.wardrobe",
    });

    expect(storeCtas[0]?.href).toBe("https://apps.apple.com/app/id000000000");
    expect(isStoreCtaAvailable(storeCtas[0]!)).toBe(true);
    expect(storeCtas[1]?.href).toBe(
      "https://play.google.com/store/apps/details?id=com.example.wardrobe",
    );
    expect(isStoreCtaAvailable(storeCtas[1]!)).toBe(true);
    expect(
      areStoreLinksPublished({
        appStoreUrl: "https://apps.apple.com/app/id000000000",
        playStoreUrl: undefined,
      }),
    ).toBe(true);
  });
});
