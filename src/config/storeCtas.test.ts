import { describe, expect, it } from "vitest";
import {
  areStoreLinksPublished,
  getStoreCtas,
  isStoreCtaAvailable,
} from "./storeCtas";

describe("getStoreCtas", () => {
  it("returns disabled placeholders when store URLs are unset", () => {
    const storeCtas = getStoreCtas({
      appStoreUrl: undefined,
      playStoreUrl: undefined,
    });

    expect(storeCtas).toHaveLength(2);
    expect(storeCtas[0]?.kind).toBe("appStore");
    expect(storeCtas[0]?.href).toBeUndefined();
    expect(isStoreCtaAvailable(storeCtas[0]!)).toBe(false);
    expect(storeCtas[1]?.kind).toBe("playStore");
    expect(isStoreCtaAvailable(storeCtas[1]!)).toBe(false);
    expect(
      areStoreLinksPublished({
        appStoreUrl: undefined,
        playStoreUrl: undefined,
      }),
    ).toBe(false);
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
