import { describe, expect, it } from "vitest";
import { FREE_CATALOG_LIMITS } from "../api/resourceTypes";
import {
  getAllPricingPlanCopy,
  getBasicPlanFeatureLines,
  getFreePlanFeatureLines,
  getFreePlanSummary,
  getPlanSummary,
  getPremiumPlanFeatureLines,
  pricingCopy,
  pricingFeatureLabels,
} from "./pricingCopy";

const SUGGESTION_CAP_COPY_PATTERN =
  /up to\s+\d+|\d+\s+per\s+(day|week|month)|suggestion cap|\d+\s+(outfit suggestions|suggested outfits)/i;

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
      { label: pricingFeatureLabels.outfitSuggestions, included: false },
      { label: pricingFeatureLabels.virtualTryOn, included: false },
      { label: pricingFeatureLabels.virtualProfile, included: false },
    ]);
  });

  it("lists Basic unlimited wardrobes, items, outfits, and outfit suggestions", () => {
    expect(pricingCopy.basicName).toBe("Basic");
    expect(pricingCopy.basicSummary).toBe(
      "Unlimited wardrobes, items, outfits, and outfit suggestions",
    );
    expect(getBasicPlanFeatureLines()).toEqual([
      { label: pricingCopy.unlimitedWardrobes, included: true },
      { label: pricingCopy.unlimitedItems, included: true },
      { label: pricingCopy.unlimitedOutfits, included: true },
      { label: pricingCopy.unlimitedOutfitSuggestions, included: true },
      { label: pricingFeatureLabels.virtualTryOn, included: false },
      { label: pricingFeatureLabels.virtualProfile, included: false },
    ]);
    expect(getPlanSummary({ tier: "basic", source: "stripe" })).toBe(
      pricingCopy.basicSummary,
    );
  });

  it("lists Premium catalog and styling features with Outfit suggestions included, not unlimited", () => {
    expect(pricingCopy.premiumName).toBe("Premium");
    expect(pricingCopy.premiumSummary).toBe(
      "Unlimited wardrobes, items, and outfits plus Virtual Try On, Virtual Profile, and Outfit suggestions",
    );
    expect(getPremiumPlanFeatureLines()).toEqual([
      { label: pricingCopy.unlimitedWardrobes, included: true },
      { label: pricingCopy.unlimitedItems, included: true },
      { label: pricingCopy.unlimitedOutfits, included: true },
      { label: pricingFeatureLabels.outfitSuggestions, included: true },
      { label: pricingFeatureLabels.virtualTryOn, included: true },
      { label: pricingFeatureLabels.virtualProfile, included: true },
    ]);
    expect(getPlanSummary({ tier: "premium", source: "ios" })).toBe(
      pricingCopy.premiumSummary,
    );
    expect(getPlanSummary(null)).toBe(getFreePlanSummary());
    const premiumCopy = [
      pricingCopy.premiumSummary,
      ...getPremiumPlanFeatureLines().map((feature) => feature.label),
    ].join("\n");
    expect(premiumCopy).toContain("Outfit suggestions");
    expect(premiumCopy).not.toMatch(/unlimited outfit suggestions/i);
    expect(premiumCopy).not.toMatch(/unlimited suggested outfits/i);
    expect(premiumCopy).not.toMatch(SUGGESTION_CAP_COPY_PATTERN);
  });

  it("uses the required feature names and never mentions AI, catalog, try-on, or suggestion caps", () => {
    const copy = getAllPricingPlanCopy().join("\n");
    const basicCopy = [
      pricingCopy.basicSummary,
      ...getBasicPlanFeatureLines().map((feature) => feature.label),
    ].join("\n");

    expect(basicCopy).toContain("Unlimited outfit suggestions");
    expect(copy).toContain("Unlimited wardrobes");
    expect(copy).toContain("Unlimited items");
    expect(copy).toContain("Unlimited outfits");
    expect(copy).toContain("Unlimited outfit suggestions");
    expect(copy).toContain("Virtual Try On");
    expect(copy).toContain("Virtual Profile");
    expect(copy).toContain("Outfit suggestions");
    expect(copy).not.toContain("Unlimited catalog");
    expect(copy).not.toMatch(/\bAI\b/);
    expect(copy).not.toContain("AI Profile");
    expect(copy).not.toMatch(/\d+\s+try-?ons?\b/i);
    expect(copy).not.toMatch(/\d+\s+Virtual Try On/);
    expect(copy).not.toMatch(/\d+\s+Virtual Profile/);
    expect(copy).not.toMatch(/\d+\s+Outfit suggestions/);
    expect(copy).not.toMatch(SUGGESTION_CAP_COPY_PATTERN);
    expect(copy).not.toMatch(/£|\$|€/);
  });
});
