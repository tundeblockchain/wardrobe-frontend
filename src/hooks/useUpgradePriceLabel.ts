import type { BillingInterval } from "../api/billing";
import type { FetchBillingPlansFn } from "../api/billingPlans";
import type { PaidPlanTier } from "../api/resourceTypes";
import { getUpgradePriceLabel } from "../content/upgradePriceLabel";
import { useBillingPlans } from "./useBillingPlans";

export type UseUpgradePriceLabelInput = {
  actionLabel: string;
  checkoutTier: PaidPlanTier;
  billingInterval: BillingInterval;
  fetchPlans?: FetchBillingPlansFn;
};

export const useUpgradePriceLabel = ({
  actionLabel,
  checkoutTier,
  billingInterval,
  fetchPlans,
}: UseUpgradePriceLabelInput): string => {
  const plansQuery = useBillingPlans({ fetchPlans });
  const plans =
    plansQuery.status === "ready" ? plansQuery.data.plans : undefined;

  return getUpgradePriceLabel({
    actionLabel,
    plans,
    tier: checkoutTier,
    interval: billingInterval,
  });
};
