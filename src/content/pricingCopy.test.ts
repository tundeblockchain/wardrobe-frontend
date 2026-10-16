import { describe, expect, it } from "vitest";
import { FREE_CATALOG_LIMITS } from "../api/resourceTypes";
import {
  getAllPricingPlanCopy,
  getBasicPlanFeatureLines,
  getFreePlanFeatureLines,
  getFreePlanSummary,
  getPremiumPlanFeatureLines,
  pricingCopy,
  pricingFeatureLabels,
} from "./pricingCopy";

describe("pricing copy", () => {
  it("builds the Free summary from shared catalog limits", () => {
    expect(FREE_CATALOG_LIMITS).toEqual({
      wardrobes: 1,
      items: 5,
      outfits: 5,
    });
    expect(getFreePlanSummary()).toBe("1 wardrobe, 5 items, 5 outfits");
  });

  it("lists Free included catalog limits and excluded Premium features", () => {
    expect(getFreePlanFeatureLines()).toEqual([
      { label: "1 wardrobe", included: true },
      { label: "5 items", included: true },
      { label: "5 outfits", included: true },
      { label: pricingFeatureLabels.virtualTryOn, included: false },
      { label: pricingFeatureLabels.virtualProfile, included: false },
      { label: pricingFeatureLabels.outfitSuggestions, included: false },
    ]);
  });

  it("lists Basic unlimited catalog and excluded Premium features", () => {
    expect(pricingCopy.basicName).toBe("Basic");
    expect(pricingCopy.basicSummary).toBe(
      "Unlimited wardrobes, items, and outfits",
    );
    expect(getBasicPlanFeatureLines()).toEqual([
      { label: pricingCopy.unlimitedCatalog, included: true },
      { label: pricingFeatureLabels.virtualTryOn, included: false },
      { label: pricingFeatureLabels.virtualProfile, included: false },
      { label: pricingFeatureLabels.outfitSuggestions, included: false },
    ]);
  });

  it("lists Premium unlimited catalog plus styling features", () => {
    expect(pricingCopy.premiumName).toBe("Premium");
    expect(pricingCopy.premiumSummary).toBe(
      "Unlimited catalog plus Virtual Try On and styling",
    );
    expect(getPremiumPlanFeatureLines()).toEqual([
      { label: pricingCopy.unlimitedCatalog, included: true },
      { label: pricingFeatureLabels.virtualTryOn, included: true },
      { label: pricingFeatureLabels.virtualProfile, included: true },
      { label: pricingFeatureLabels.outfitSuggestions, included: true },
    ]);
  });

  it("uses the required feature names and never mentions AI or try-on caps", () => {
    const copy = getAllPricingPlanCopy().join("\n");

    expect(copy).toContain("Virtual Try On");
    expect(copy).toContain("Virtual Profile");
    expect(copy).toContain("Outfit suggestions");
    expect(copy).not.toMatch(/\bAI\b/);
    expect(copy).not.toContain("AI Profile");
    expect(copy).not.toMatch(/\d+\s+try-?ons?\b/i);
    expect(copy).not.toMatch(/\d+\s+Virtual Try On/);
    expect(copy).not.toMatch(/\d+\s+Virtual Profile/);
    expect(copy).not.toMatch(/\d+\s+Outfit suggestions/);
    expect(copy).not.toMatch(/£|\$|€/);
  });
});
