import { describe, expect, it } from "vitest";
import {
  getScreenshotSrc,
  getScreenshotSrcSet,
  heroScreenshot,
  screenshotSlotIds,
  screenshotSlots,
} from "./screenshotSlots";

describe("screenshotSlots", () => {
  it("covers the six real iOS showcase slots", () => {
    expect(screenshotSlotIds).toEqual([
      "try-on-rust-floral",
      "try-on-ivory-maxi",
      "try-on-blue-mini",
      "home",
      "item-detail",
      "add-item",
    ]);
    expect(screenshotSlots.map((slot) => slot.label)).toEqual([
      "Virtual Try On",
      "Ivory maxi",
      "Blue mini",
      "Home",
      "Item detail",
      "Add item",
    ]);
  });

  it("uses the rust floral Virtual Try On shot as the default hero", () => {
    expect(heroScreenshot?.id).toBe("try-on-rust-floral");
    expect(screenshotSlots[0]?.src).toBe(
      "/screenshots/try-on-rust-floral-780.jpg",
    );
    expect(screenshotSlots[0]?.alt).toBe(
      "Pocket Closet Virtual Try On showing a rust floral maxi dress on the user's profile photo",
    );
  });

  it("points responsive assets at the public screenshots folder", () => {
    expect(getScreenshotSrc("home")).toBe("/screenshots/home-780.jpg");
    expect(getScreenshotSrc("home", 390, "webp")).toBe(
      "/screenshots/home-390.webp",
    );
    expect(getScreenshotSrcSet("add-item", "avif")).toBe(
      "/screenshots/add-item-390.avif 390w, /screenshots/add-item-780.avif 780w, /screenshots/add-item-1170.avif 1170w",
    );
    expect(screenshotSlots[0]?.sources.webp).toContain(
      "/screenshots/try-on-rust-floral-1170.webp 1170w",
    );
  });
});
