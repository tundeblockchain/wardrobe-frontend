import { describe, expect, it } from "vitest";
import {
  getScreenshotSrc,
  screenshotFormat,
  screenshotSlotIds,
  screenshotSlots,
} from "./screenshotSlots";

describe("screenshotSlots", () => {
  it("covers the six labeled showcase slots", () => {
    expect(screenshotSlotIds).toEqual([
      "home",
      "wardrobe-detail",
      "item-detail",
      "outfits",
      "try-on",
      "account",
    ]);
    expect(screenshotSlots.map((slot) => slot.label)).toEqual([
      "Home",
      "Wardrobe detail",
      "Item detail",
      "Outfits",
      "Try-on",
      "Account",
    ]);
  });

  it("points placeholder assets at the public screenshots folder", () => {
    expect(screenshotFormat).toBe("svg");
    expect(getScreenshotSrc("home")).toBe("/screenshots/home.svg");
    expect(screenshotSlots[0]?.src).toBe("/screenshots/home.svg");
    expect(screenshotSlots[0]?.alt).toBe("Placeholder for the Home screen");
  });
});
