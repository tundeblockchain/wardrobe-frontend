import { describe, expect, it } from "vitest";
import {
  getFreePlanFeatureLines,
  getPremiumPlanFeatureLines,
  pricingCopy,
} from "./pricingCopy";

describe("pricing copy", () => {
  it("uses Free plan include lines from /me limits when present", () => {
    expect(
      getFreePlanFeatureLines({ wardrobes: 1, items: 5, outfits: 5 }),
    ).toEqual([
      "The Free plan includes 1 wardrobe.",
      "The Free plan includes 5 clothing items.",
      "The Free plan includes 5 outfits.",
      pricingCopy.premiumFeature,
    ]);
  });

  it("falls back to existing catalog and Virtual Try On copy without inventing prices", () => {
    const lines = getFreePlanFeatureLines();
    expect(lines.join(" ")).toMatch(/closet|wardrobe/i);
    expect(lines.join(" ")).toContain("Virtual Try On");
    expect(lines.join(" ")).not.toMatch(/£|\$|€/);
    expect(getPremiumPlanFeatureLines().join(" ")).toContain("Virtual Try On");
  });
});
