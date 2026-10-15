import { describe, expect, it } from "vitest";
import type { EntitlementLimits, EntitlementUsage } from "../api/resourceTypes";
import {
  getCatalogLimitDescription,
  getCatalogLimitErrorMessage,
  getFreePlanIncludesCopy,
} from "./catalogLimitCopy";

const customLimits: EntitlementLimits = {
  wardrobes: 3,
  items: 12,
  outfits: 20,
};

const customUsage: EntitlementUsage = {
  wardrobes: 2,
  items: 7,
  outfits: 20,
};

describe("catalog limit copy", () => {
  it("returns Free plan include copy without an upgrade suffix", () => {
    expect(getFreePlanIncludesCopy("wardrobe", customLimits)).toBe(
      "The Free plan includes 3 wardrobes.",
    );
    expect(getFreePlanIncludesCopy("item", customLimits)).toBe(
      "The Free plan includes 12 clothing items.",
    );
    expect(getFreePlanIncludesCopy("outfit")).toBeUndefined();
  });

  it("interpolates non-default /me limits into upgrade descriptions", () => {
    expect(getCatalogLimitDescription("wardrobe", { limits: customLimits })).toBe(
      "The Free plan includes 3 wardrobes. Upgrade your plan to add another.",
    );
    expect(getCatalogLimitDescription("item", { limits: customLimits })).toBe(
      "The Free plan includes 12 clothing items. Upgrade your plan to add another.",
    );
    expect(getCatalogLimitDescription("outfit", { limits: customLimits })).toBe(
      "The Free plan includes 20 outfits. Upgrade your plan to add another.",
    );
  });

  it("includes /me usage when it is provided", () => {
    expect(
      getCatalogLimitDescription("wardrobe", {
        limits: customLimits,
        usage: customUsage,
      }),
    ).toBe("You've used 2 of 3 wardrobes. Upgrade your plan to add another.");
    expect(
      getCatalogLimitDescription("item", {
        limits: customLimits,
        usage: customUsage,
      }),
    ).toBe(
      "You've used 7 of 12 clothing items. Upgrade your plan to add another.",
    );
    expect(
      getCatalogLimitDescription("outfit", {
        limits: customLimits,
        usage: customUsage,
      }),
    ).toBe("You've used 20 of 20 outfits. Upgrade your plan to add another.");
  });

  it("uses singular nouns when the /me limit is 1", () => {
    expect(
      getCatalogLimitDescription("wardrobe", {
        limits: { wardrobes: 1, items: 1, outfits: 1 },
      }),
    ).toBe(
      "The Free plan includes 1 wardrobe. Upgrade your plan to add another.",
    );
  });

  it("uses fallback copy without numbers when /me is missing or has no limits", () => {
    expect(getCatalogLimitDescription("wardrobe")).toBe(
      "This plan has reached its wardrobe limit. Upgrade your plan to add another.",
    );
    expect(getCatalogLimitDescription("item", { limits: null })).toBe(
      "This plan has reached its clothing item limit. Upgrade your plan to add another.",
    );
    expect(getCatalogLimitDescription("outfit", {})).toBe(
      "This plan has reached its outfit limit. Upgrade your plan to add another.",
    );
    expect(getCatalogLimitDescription("wardrobe")).not.toMatch(/\d/);
    expect(getCatalogLimitDescription("item", { limits: null })).not.toMatch(
      /\d/,
    );
    expect(getCatalogLimitDescription("outfit")).not.toMatch(/\d/);
  });

  it("interpolates non-default limits into catalog limit error messages", () => {
    expect(getCatalogLimitErrorMessage("wardrobe", customLimits)).toBe(
      "Free plan allows 3 wardrobes. Upgrade to add more.",
    );
    expect(getCatalogLimitErrorMessage("item", customLimits)).toBe(
      "Free plan allows 12 clothing items. Upgrade to add more.",
    );
    expect(getCatalogLimitErrorMessage("outfit", customLimits)).toBe(
      "Free plan allows 20 outfits. Upgrade to add more.",
    );
  });

  it("uses fallback error copy without numbers when limits are missing", () => {
    expect(getCatalogLimitErrorMessage("wardrobe")).toBe(
      "Free plan wardrobe limit reached. Upgrade to add more.",
    );
    expect(getCatalogLimitErrorMessage("item", null)).toBe(
      "Free plan clothing item limit reached. Upgrade to add more.",
    );
    expect(getCatalogLimitErrorMessage("outfit")).not.toMatch(/\d/);
  });
});
