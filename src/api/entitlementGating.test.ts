import { describe, expect, it } from "vitest";
import {
  canUseAiTryOn,
  canUseOtherAi,
  getCatalogKindForLimitCode,
  getForbiddenUpgradeKind,
  isEntitlementAiRequiredError,
} from "./entitlementGating";
import { ApiError } from "./httpClient";
import type { Entitlement } from "./resourceTypes";

const entitlement = (
  features: Entitlement["features"],
): Entitlement => {
  return {
    userId: "user-1",
    tier: "FREE",
    status: "NONE",
    features,
    limits: { wardrobes: 1, items: 5, outfits: 5 },
    usage: { wardrobes: 0, items: 0, outfits: 0 },
    updatedAt: "2026-10-13T12:00:00.000Z",
  };
};

describe("entitlement gating", () => {
  it("shows Virtual Profiles and Virtual Try On only when aiTryOn is on", () => {
    expect(
      canUseAiTryOn(
        entitlement({
          unlimitedCatalog: false,
          aiTryOn: true,
          otherAi: false,
        }),
      ),
    ).toBe(true);
    expect(
      canUseAiTryOn(
        entitlement({
          unlimitedCatalog: true,
          aiTryOn: false,
          otherAi: true,
        }),
      ),
    ).toBe(false);
  });

  it("gates other AI actions with otherAi", () => {
    expect(
      canUseOtherAi(
        entitlement({
          unlimitedCatalog: true,
          aiTryOn: true,
          otherAi: true,
        }),
      ),
    ).toBe(true);
    expect(
      canUseOtherAi(
        entitlement({
          unlimitedCatalog: true,
          aiTryOn: true,
          otherAi: false,
        }),
      ),
    ).toBe(false);
  });
});

describe("403 entitlement code mapping", () => {
  it("maps catalog limit codes to a Basic upgrade", () => {
    expect(
      getForbiddenUpgradeKind(
        new ApiError({ status: 403, code: "ENTITLEMENT_WARDROBE_LIMIT" }),
      ),
    ).toBe("basic");
    expect(
      getForbiddenUpgradeKind(
        new ApiError({ status: 403, code: "ENTITLEMENT_ITEM_LIMIT" }),
      ),
    ).toBe("basic");
    expect(
      getForbiddenUpgradeKind(
        new ApiError({ status: 403, code: "ENTITLEMENT_OUTFIT_LIMIT" }),
      ),
    ).toBe("basic");
    expect(getCatalogKindForLimitCode("ENTITLEMENT_WARDROBE_LIMIT")).toBe(
      "wardrobe",
    );
    expect(getCatalogKindForLimitCode("ENTITLEMENT_ITEM_LIMIT")).toBe("item");
    expect(getCatalogKindForLimitCode("ENTITLEMENT_OUTFIT_LIMIT")).toBe(
      "outfit",
    );
  });

  it("maps ENTITLEMENT_AI_REQUIRED to a Premium upgrade", () => {
    const error = new ApiError({
      status: 403,
      code: "ENTITLEMENT_AI_REQUIRED",
    });
    expect(getForbiddenUpgradeKind(error)).toBe("premium");
    expect(isEntitlementAiRequiredError(error)).toBe(true);
  });

  it("ignores other failures", () => {
    expect(
      getForbiddenUpgradeKind(new ApiError({ status: 403, code: "FORBIDDEN" })),
    ).toBeUndefined();
    expect(
      getForbiddenUpgradeKind(new ApiError({ status: 404, code: "ITEM_NOT_FOUND" })),
    ).toBeUndefined();
    expect(getForbiddenUpgradeKind(new Error("no"))).toBeUndefined();
    expect(
      isEntitlementAiRequiredError(
        new ApiError({ status: 403, code: "ENTITLEMENT_ITEM_LIMIT" }),
      ),
    ).toBe(false);
  });
});
