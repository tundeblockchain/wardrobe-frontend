import type { PaidPlanTier } from "../api/resourceTypes";

export type PricingTier = "free" | PaidPlanTier;

export type PricingPlanActionKind =
  | "sign-up"
  | "sign-in"
  | "checkout"
  | "portal"
  | "unavailable";

export type PricingPlanActionInput = {
  planTier: PricingTier;
  currentTier: PricingTier | undefined;
  isSignedIn: boolean;
  isStoreManaged: boolean;
  canCheckout: boolean;
  hasSelectedPlan: boolean;
};

export const PRICING_TIER_RANK: Record<PricingTier, number> = {
  free: 0,
  basic: 1,
  premium: 2,
};

export const getPricingPlanActionKind = ({
  planTier,
  currentTier,
  isSignedIn,
  isStoreManaged,
  canCheckout,
  hasSelectedPlan,
}: PricingPlanActionInput): PricingPlanActionKind | undefined => {
  if (!isSignedIn) {
    if (planTier === "free") {
      return "sign-up";
    }

    return "sign-in";
  }

  if (currentTier === undefined) {
    return undefined;
  }

  if (currentTier === planTier) {
    return undefined;
  }

  if (PRICING_TIER_RANK[planTier] < PRICING_TIER_RANK[currentTier]) {
    if (
      currentTier === "premium" &&
      planTier === "basic" &&
      !isStoreManaged
    ) {
      return "portal";
    }

    return undefined;
  }

  if (isStoreManaged || planTier === "free") {
    return undefined;
  }

  if (!hasSelectedPlan || !canCheckout) {
    return "unavailable";
  }

  return "checkout";
};
