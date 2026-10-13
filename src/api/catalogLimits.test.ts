import { describe, expect, it } from "vitest";
import {
  catalogLimitError,
  isAtCatalogLimit,
  isCatalogLimitError,
} from "./catalogLimits";
import { ApiError } from "./httpClient";
import type { Entitlement } from "./resourceTypes";

const freeEntitlement = (usage: Entitlement["usage"]): Entitlement => {
  return {
    userId: "user-1",
    tier: "FREE",
    status: "NONE",
    features: {
      unlimitedCatalog: false,
      aiTryOn: false,
      otherAi: false,
    },
    limits: { wardrobes: 1, items: 5, outfits: 5 },
    usage,
    updatedAt: "2026-10-01T09:12:00.000Z",
  };
};

describe("catalog limits", () => {
  it("is under the Free limit until usage reaches the cap", () => {
    const entitlement = freeEntitlement({
      wardrobes: 0,
      items: 4,
      outfits: 5,
    });

    expect(isAtCatalogLimit(entitlement, "wardrobe")).toBe(false);
    expect(isAtCatalogLimit(entitlement, "item")).toBe(false);
    expect(isAtCatalogLimit(entitlement, "outfit")).toBe(true);
  });

  it("treats usage at or over the cap as blocked", () => {
    const entitlement = freeEntitlement({
      wardrobes: 1,
      items: 6,
      outfits: 5,
    });

    expect(isAtCatalogLimit(entitlement, "wardrobe")).toBe(true);
    expect(isAtCatalogLimit(entitlement, "item")).toBe(true);
    expect(isAtCatalogLimit(entitlement, "outfit")).toBe(true);
  });

  it("does not block unlimited catalog entitlements", () => {
    const entitlement: Entitlement = {
      ...freeEntitlement({ wardrobes: 9, items: 9, outfits: 9 }),
      tier: "PREMIUM",
      features: {
        unlimitedCatalog: true,
        aiTryOn: true,
        otherAi: true,
      },
      limits: null,
    };

    expect(isAtCatalogLimit(entitlement, "wardrobe")).toBe(false);
    expect(isAtCatalogLimit(entitlement, "item")).toBe(false);
    expect(isAtCatalogLimit(entitlement, "outfit")).toBe(false);
  });

  it("builds 403 messages from /me limits instead of hardcoded caps", () => {
    const limits = { wardrobes: 3, items: 12, outfits: 20 };

    expect(catalogLimitError("wardrobe", limits).message).toBe(
      "Free plan allows 3 wardrobes. Upgrade to add more.",
    );
    expect(catalogLimitError("item", limits).message).toBe(
      "Free plan allows 12 clothing items. Upgrade to add more.",
    );
    expect(catalogLimitError("outfit", limits).message).toBe(
      "Free plan allows 20 outfits. Upgrade to add more.",
    );
    expect(catalogLimitError("wardrobe").message).not.toMatch(/\d/);
  });

  it("detects server 403 catalog limit errors", () => {
    expect(isCatalogLimitError(catalogLimitError("item"))).toBe(true);
    expect(
      isCatalogLimitError(
        new ApiError({ status: 403, code: "ENTITLEMENT_WARDROBE_LIMIT" }),
      ),
    ).toBe(true);
    expect(
      isCatalogLimitError(
        new ApiError({ status: 403, code: "ENTITLEMENT_AI_REQUIRED" }),
      ),
    ).toBe(false);
    expect(isCatalogLimitError(new ApiError({ status: 500 }))).toBe(false);
  });
});
