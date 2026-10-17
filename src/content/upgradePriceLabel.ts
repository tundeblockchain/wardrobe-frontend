import type { BillingInterval } from "../api/billing";
import {
  findBillingPlan,
  formatBillingPrice,
  type BillingPlan,
} from "../api/billingPlans";
import type { PaidPlanTier } from "../api/resourceTypes";

export const upgradePriceCopy = {
  monthlySuffix: "/month",
  yearlySuffix: "/year",
} as const;

export const formatUpgradePriceSuffix = (
  unitAmount: number,
  currency: string,
  interval: BillingInterval,
): string => {
  const formattedPrice = formatBillingPrice(unitAmount, currency);
  const suffix =
    interval === "yearly"
      ? upgradePriceCopy.yearlySuffix
      : upgradePriceCopy.monthlySuffix;

  return `${formattedPrice}${suffix}`;
};

export const appendUpgradePriceLabel = (
  actionLabel: string,
  priceSuffix: string | undefined,
): string => {
  if (!priceSuffix) {
    return actionLabel;
  }

  return `${actionLabel}, ${priceSuffix}`;
};

export type GetUpgradePriceLabelInput = {
  actionLabel: string;
  plans: readonly BillingPlan[] | undefined;
  tier: PaidPlanTier;
  interval: BillingInterval;
};

export const getUpgradePriceLabel = ({
  actionLabel,
  plans,
  tier,
  interval,
}: GetUpgradePriceLabelInput): string => {
  if (!plans) {
    return actionLabel;
  }

  const plan = findBillingPlan(plans, tier, interval);
  if (!plan) {
    return actionLabel;
  }

  return appendUpgradePriceLabel(
    actionLabel,
    formatUpgradePriceSuffix(plan.unitAmount, plan.currency, interval),
  );
};
