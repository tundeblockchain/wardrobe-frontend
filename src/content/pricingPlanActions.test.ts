import { describe, expect, it } from "vitest";
import {
  getPricingPlanActionKind,
  type PricingPlanActionInput,
  type PricingTier,
} from "./pricingPlanActions";

const getAction = (
  planTier: PricingTier,
  overrides: Partial<PricingPlanActionInput> = {},
) => {
  return getPricingPlanActionKind({
    planTier,
    currentTier: "free",
    isSignedIn: true,
    isStoreManaged: false,
    canCheckout: true,
    hasSelectedPlan: true,
    ...overrides,
  });
};

describe("getPricingPlanActionKind", () => {
  it("lets signed-out visitors sign up on Free and sign in on paid plans", () => {
    expect(getAction("free", { isSignedIn: false, currentTier: undefined })).toBe(
      "sign-up",
    );
    expect(
      getAction("basic", { isSignedIn: false, currentTier: undefined }),
    ).toBe("sign-in");
    expect(
      getAction("premium", { isSignedIn: false, currentTier: undefined }),
    ).toBe("sign-in");
  });

  it("hides signed-in actions until GET /me has a current tier", () => {
    expect(getAction("basic", { currentTier: undefined })).toBeUndefined();
    expect(getAction("premium", { currentTier: undefined })).toBeUndefined();
  });

  it("gives a Free user no Free upgrade and checkout on Basic and Premium", () => {
    expect(getAction("free", { currentTier: "free" })).toBeUndefined();
    expect(getAction("basic", { currentTier: "free" })).toBe("checkout");
    expect(getAction("premium", { currentTier: "free" })).toBe("checkout");
  });

  it("gives a Basic user Premium checkout and never Upgrade on a lower plan", () => {
    expect(getAction("free", { currentTier: "basic" })).toBeUndefined();
    expect(getAction("basic", { currentTier: "basic" })).toBeUndefined();
    expect(getAction("premium", { currentTier: "basic" })).toBe("checkout");
  });

  it("gives a Premium user Choose plan (portal) on Basic and nothing lower or current", () => {
    expect(getAction("free", { currentTier: "premium" })).toBeUndefined();
    expect(getAction("basic", { currentTier: "premium" })).toBe("portal");
    expect(getAction("premium", { currentTier: "premium" })).toBeUndefined();
  });

  it("does not open the portal for a store-managed Premium plan", () => {
    expect(
      getAction("basic", { currentTier: "premium", isStoreManaged: true }),
    ).toBeUndefined();
    expect(
      getAction("premium", { currentTier: "basic", isStoreManaged: true }),
    ).toBeUndefined();
  });

  it("marks a missing or blocked paid catalog row unavailable", () => {
    expect(
      getAction("premium", { currentTier: "free", hasSelectedPlan: false }),
    ).toBe("unavailable");
    expect(
      getAction("basic", { currentTier: "free", canCheckout: false }),
    ).toBe("unavailable");
  });
});
