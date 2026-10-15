import type { CatalogKind, EntitlementLimits } from "../api/resourceTypes";
import { getFreePlanIncludesCopy } from "./catalogLimitCopy";
import { dashboardCopy } from "./dashboardCopy";

export const pricingCopy = {
  title: "Pricing",
  description:
    "Compare Free, Basic, and Premium. Paid prices come from the live catalog.",
  loadingLabel: "Loading plans",
  unavailableTitle: "Plans unavailable",
  unavailableDescription:
    "Billing plans are temporarily unavailable. Try again in a moment.",
  retryLabel: "Retry",
  retryAriaLabel: "Retry loading billing plans",
  intervalHint: "Prices update when you switch monthly or yearly billing.",
  freeName: "Free",
  basicName: "Basic",
  premiumName: "Premium",
  freePriceLabel: "Free",
  currentPlanLabel: "Current plan",
  currentPlanAriaLabel: "Current plan",
  upgradeBasicLabel: "Upgrade to Basic",
  upgradeBasicAriaLabel: "Upgrade to Basic",
  upgradePremiumLabel: "Upgrade to Premium",
  upgradePremiumAriaLabel: "Upgrade to Premium",
  upgradeUnavailableLabel: "Upgrade unavailable",
  upgradeUnavailableAriaLabel: "Upgrade unavailable for this plan",
  signInToUpgradeLabel: "Sign in to upgrade",
  signInToUpgradeAriaLabel: "Sign in or sign up to upgrade",
  signInToUpgradeBasicAriaLabel: "Sign in or sign up to upgrade to Basic",
  signInToUpgradePremiumAriaLabel: "Sign in or sign up to upgrade to Premium",
  signUpLabel: "Sign up",
  signUpAriaLabel: "Sign up to get started",
  signInLabel: "Sign in",
  signInAriaLabel: "Sign in to upgrade",
  comparePlansLabel: "Compare plans",
  comparePlansAriaLabel: "Compare Free, Basic, and Premium plans",
  monthlyPriceSuffix: "per month",
  yearlyPriceSuffix: "per year",
  basicUnlimitedCatalog:
    "Upgrade to Basic to add more wardrobes, clothing items, or outfits.",
  premiumFeature: dashboardCopy.upgrade.premium.description,
  premiumTitle: dashboardCopy.upgrade.premium.title,
} as const;

const FREE_LIMIT_KINDS: CatalogKind[] = ["wardrobe", "item", "outfit"];

export const getFreePlanFeatureLines = (
  limits?: EntitlementLimits | null,
): string[] => {
  const limitLines = FREE_LIMIT_KINDS.flatMap((kind) => {
    const line = getFreePlanIncludesCopy(kind, limits);
    return line ? [line] : [];
  });

  if (limitLines.length === 0) {
    return [
      dashboardCopy.upgrade.basic.description,
      pricingCopy.premiumFeature,
    ];
  }

  return [...limitLines, pricingCopy.premiumFeature];
};

export const getBasicPlanFeatureLines = (): string[] => {
  return [pricingCopy.basicUnlimitedCatalog, pricingCopy.premiumFeature];
};

export const getPremiumPlanFeatureLines = (): string[] => {
  return [pricingCopy.basicUnlimitedCatalog, pricingCopy.premiumFeature];
};
