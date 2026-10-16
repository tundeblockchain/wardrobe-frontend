import { FREE_CATALOG_LIMITS } from "../api/resourceTypes";

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
  basicSummary: "Unlimited wardrobes, items, and outfits",
  premiumSummary:
    "Unlimited wardrobes, items, and outfits plus Virtual Try On, Virtual Profile, and Outfit suggestions",
  unlimitedWardrobes: "Unlimited wardrobes",
  unlimitedItems: "Unlimited items",
  unlimitedOutfits: "Unlimited outfits",
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

const getPremiumOnlyFeatures = (included: boolean): PricingPlanFeature[] => {
  return [
    { label: pricingFeatureLabels.virtualTryOn, included },
    { label: pricingFeatureLabels.virtualProfile, included },
    { label: pricingFeatureLabels.outfitSuggestions, included },
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
    ...getPremiumOnlyFeatures(false),
  ];
};

export const getBasicPlanFeatureLines = (): PricingPlanFeature[] => {
  return [
    ...getUnlimitedCatalogFeatureLines(),
    ...getPremiumOnlyFeatures(false),
  ];
};

export const getPremiumPlanFeatureLines = (): PricingPlanFeature[] => {
  return [
    ...getUnlimitedCatalogFeatureLines(),
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
    ...getFreePlanFeatureLines().map((feature) => feature.label),
    ...getBasicPlanFeatureLines().map((feature) => feature.label),
    ...getPremiumPlanFeatureLines().map((feature) => feature.label),
  ];
};
