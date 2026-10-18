import { FREE_CATALOG_LIMITS, type PaidTier } from "../api/resourceTypes";

export type PricingPlanFeature = {
  label: string;
  included: boolean;
};

export const pricingFeatureLabels = {
  virtualTryOn: "Virtual Try On",
  virtualProfile: "Virtual Profile",
  outfitSuggestions: "Outfit suggestions",
} as const;

const formatCatalogCount = (
  count: number,
  singular: string,
  plural: string,
): string => {
  return `${count} ${count === 1 ? singular : plural}`;
};

export const getFreePlanSummary = (): string => {
  const { wardrobes, items, outfits } = FREE_CATALOG_LIMITS;
  return [
    formatCatalogCount(wardrobes, "wardrobe", "wardrobes"),
    formatCatalogCount(items, "item", "items"),
    formatCatalogCount(outfits, "outfit", "outfits"),
  ].join(", ");
};

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
  basicSummary:
    "Unlimited wardrobes, items, outfits, and outfit suggestions",
  premiumSummary:
    "Unlimited wardrobes, items, outfits, and outfit suggestions plus Virtual Try On and Virtual Profile",
  unlimitedWardrobes: "Unlimited wardrobes",
  unlimitedItems: "Unlimited items",
  unlimitedOutfits: "Unlimited outfits",
  unlimitedOutfitSuggestions: "Unlimited outfit suggestions",
  currentPlanLabel: "Current plan",
  currentPlanAriaLabel: "Current plan",
  upgradeBasicLabel: "Upgrade to Basic",
  upgradeBasicAriaLabel: "Upgrade to Basic",
  upgradePremiumLabel: "Upgrade to Premium",
  upgradePremiumAriaLabel: "Upgrade to Premium",
  choosePlanLabel: "Choose plan",
  choosePlanAriaLabel: "Choose plan",
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
} as const;

export const getPlanSummary = (paidTier: PaidTier): string => {
  if (!paidTier) {
    return getFreePlanSummary();
  }
  if (paidTier.tier === "basic") {
    return pricingCopy.basicSummary;
  }

  return pricingCopy.premiumSummary;
};

const getOutfitSuggestionsFeature = (
  included: boolean,
): PricingPlanFeature => {
  return {
    label: included
      ? pricingCopy.unlimitedOutfitSuggestions
      : pricingFeatureLabels.outfitSuggestions,
    included,
  };
};

const getPremiumOnlyFeatures = (included: boolean): PricingPlanFeature[] => {
  return [
    { label: pricingFeatureLabels.virtualTryOn, included },
    { label: pricingFeatureLabels.virtualProfile, included },
  ];
};

const getUnlimitedCatalogFeatureLines = (): PricingPlanFeature[] => {
  return [
    { label: pricingCopy.unlimitedWardrobes, included: true },
    { label: pricingCopy.unlimitedItems, included: true },
    { label: pricingCopy.unlimitedOutfits, included: true },
  ];
};

export const getFreePlanFeatureLines = (): PricingPlanFeature[] => {
  const { wardrobes, items, outfits } = FREE_CATALOG_LIMITS;
  return [
    {
      label: formatCatalogCount(wardrobes, "wardrobe", "wardrobes"),
      included: true,
    },
    { label: formatCatalogCount(items, "item", "items"), included: true },
    {
      label: formatCatalogCount(outfits, "outfit", "outfits"),
      included: true,
    },
    getOutfitSuggestionsFeature(false),
    ...getPremiumOnlyFeatures(false),
  ];
};

export const getBasicPlanFeatureLines = (): PricingPlanFeature[] => {
  return [
    ...getUnlimitedCatalogFeatureLines(),
    getOutfitSuggestionsFeature(true),
    ...getPremiumOnlyFeatures(false),
  ];
};

export const getPremiumPlanFeatureLines = (): PricingPlanFeature[] => {
  return [
    ...getUnlimitedCatalogFeatureLines(),
    getOutfitSuggestionsFeature(true),
    ...getPremiumOnlyFeatures(true),
  ];
};

export const getAllPricingPlanCopy = (): string[] => {
  return [
    getFreePlanSummary(),
    pricingCopy.basicSummary,
    pricingCopy.premiumSummary,
    pricingCopy.unlimitedWardrobes,
    pricingCopy.unlimitedItems,
    pricingCopy.unlimitedOutfits,
    pricingCopy.unlimitedOutfitSuggestions,
    ...getFreePlanFeatureLines().map((feature) => feature.label),
    ...getBasicPlanFeatureLines().map((feature) => feature.label),
    ...getPremiumPlanFeatureLines().map((feature) => feature.label),
  ];
};
