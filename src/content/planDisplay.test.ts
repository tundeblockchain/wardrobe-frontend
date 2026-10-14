import { describe, expect, it } from "vitest";
import type { Entitlement } from "../api/resourceTypes";
import {
  getPaidPlanLabel,
  getPaidTier,
  getPaidTierStoreManagementCopy,
  getPlanExpiresLabel,
  isPaidTierSource,
  isStripePaidTier,
} from "./planDisplay";

const entitlement = (overrides: Partial<Entitlement> = {}): Entitlement => {
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
    usage: { wardrobes: 0, items: 0, outfits: 0 },
    updatedAt: "2026-10-01T09:12:00.000Z",
    ...overrides,
  };
};

describe("planDisplay", () => {
  it("prefers GET /me paidTier including Free null", () => {
    expect(getPaidTier(entitlement({ paidTier: null }))).toBeNull();
    expect(
      getPaidTier(
        entitlement({
          tier: "PREMIUM",
          paidTier: {
            tier: "premium",
            source: "ios",
            expiresAt: "2026-11-01T00:00:00.000Z",
          },
        }),
      ),
    ).toEqual({
      tier: "premium",
      source: "ios",
      expiresAt: "2026-11-01T00:00:00.000Z",
    });
  });

  it("derives paidTier from legacy entitlement fields when omitted", () => {
    expect(getPaidTier(entitlement())).toBeNull();
    expect(
      getPaidTier(entitlement({ tier: "BASIC", store: "STRIPE" })),
    ).toEqual({ tier: "basic", source: "stripe" });
    expect(
      getPaidTier(entitlement({ tier: "PREMIUM", store: "APP_STORE" })),
    ).toEqual({ tier: "premium", source: "ios" });
    expect(
      getPaidTier(entitlement({ tier: "PREMIUM", store: "PLAY_STORE" })),
    ).toEqual({ tier: "premium", source: "android" });
    expect(getPaidTier(entitlement({ tier: "PREMIUM" }))).toEqual({
      tier: "premium",
    });
    expect(
      getPaidTier(entitlement({ tier: "PREMIUM", store: "UNKNOWN" })),
    ).toEqual({ tier: "premium" });
  });

  it("labels the current plan and formats expiresAt", () => {
    expect(getPaidPlanLabel(null)).toBe("Free");
    expect(getPaidPlanLabel({ tier: "basic", source: "stripe" })).toBe("Basic");
    expect(getPaidPlanLabel({ tier: "premium", source: "ios" })).toBe("Premium");
    expect(getPlanExpiresLabel()).toBeUndefined();
    expect(getPlanExpiresLabel("2026-11-01T00:00:00.000Z")).toBe(
      "1 November 2026",
    );
    expect(getPlanExpiresLabel("not-a-date")).toBe("not-a-date");
  });

  it("picks store management copy from source and treats a missing source as a store plan", () => {
    expect(getPaidTierStoreManagementCopy("ios")).toBe(
      "Manage this plan in the App Store.",
    );
    expect(getPaidTierStoreManagementCopy("android")).toBe(
      "Manage this plan in Google Play.",
    );
    expect(getPaidTierStoreManagementCopy()).toBe(
      "Manage this plan in the App Store or Google Play.",
    );
    expect(isStripePaidTier({ tier: "basic", source: "stripe" })).toBe(true);
    expect(isStripePaidTier({ tier: "premium", source: "ios" })).toBe(false);
    expect(isStripePaidTier({ tier: "premium" })).toBe(false);
    expect(isStripePaidTier(null)).toBe(false);
    expect(isPaidTierSource("ios")).toBe(true);
    expect(isPaidTierSource("android")).toBe(true);
    expect(isPaidTierSource("stripe")).toBe(true);
    expect(isPaidTierSource(null)).toBe(false);
    expect(isPaidTierSource("APP_STORE")).toBe(false);
  });
});
