import { describe, expect, it } from "vitest";
import type { Entitlement } from "../api/resourceTypes";
import {
  getPlanManagementCopy,
  getPlanPeriodLabel,
  getPlanStatusLabel,
  getPlanStoreLabel,
  getPlanTierLabel,
  shouldManagePlanInApp,
} from "./planDisplay";

const entitlement = (
  overrides: Partial<Entitlement> = {},
): Entitlement => {
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
  it("labels tiers, statuses, stores, and periods", () => {
    expect(getPlanTierLabel("FREE")).toBe("Free");
    expect(getPlanTierLabel("BASIC")).toBe("Basic");
    expect(getPlanTierLabel("PREMIUM")).toBe("Premium");
    expect(getPlanStatusLabel("NONE")).toBe("None");
    expect(getPlanStatusLabel("ACTIVE")).toBe("Active");
    expect(getPlanStatusLabel("CANCELED")).toBe("Canceled");
    expect(getPlanStatusLabel("BILLING_ISSUE")).toBe("Billing issue");
    expect(getPlanStatusLabel("PAUSED")).toBe("Paused");
    expect(getPlanStatusLabel("EXPIRED")).toBe("Expired");
    expect(getPlanStoreLabel("APP_STORE")).toBe("App Store");
    expect(getPlanStoreLabel("PLAY_STORE")).toBe("Google Play");
    expect(getPlanStoreLabel("STRIPE")).toBe("Web");
    expect(getPlanStoreLabel("UNKNOWN")).toBe("Unknown");
    expect(getPlanStoreLabel(undefined)).toBe("Unknown");
    expect(getPlanPeriodLabel("MONTHLY")).toBe("Monthly");
    expect(getPlanPeriodLabel("YEARLY")).toBe("Yearly");
    expect(getPlanPeriodLabel("UNKNOWN")).toBeUndefined();
    expect(getPlanPeriodLabel(undefined)).toBeUndefined();
  });

  it("tells App Store and Play buyers to manage the plan in the app", () => {
    expect(shouldManagePlanInApp("APP_STORE")).toBe(true);
    expect(shouldManagePlanInApp("PLAY_STORE")).toBe(true);
    expect(shouldManagePlanInApp("STRIPE")).toBe(false);
    expect(shouldManagePlanInApp("UNKNOWN")).toBe(false);
    expect(shouldManagePlanInApp(undefined)).toBe(false);

    expect(
      getPlanManagementCopy(entitlement({ tier: "PREMIUM", store: "APP_STORE" })),
    ).toBe("This plan was bought on the App Store. Manage it in the iOS app.");
    expect(
      getPlanManagementCopy(entitlement({ tier: "BASIC", store: "PLAY_STORE" })),
    ).toBe(
      "This plan was bought on Google Play. Manage it in the Android app.",
    );
  });

  it("does not offer Stripe or other payment management", () => {
    expect(
      getPlanManagementCopy(entitlement({ tier: "PREMIUM", store: "STRIPE" })),
    ).toBe(
      "This plan was bought on the web. Payment management is not available here.",
    );
    expect(
      getPlanManagementCopy(entitlement({ tier: "PREMIUM", store: "UNKNOWN" })),
    ).toBe("Purchase location is not available.");
    expect(getPlanManagementCopy(entitlement())).toBe(
      "The Free plan is included with the account.",
    );
  });
});
