import type {
  Entitlement,
  EntitlementStore,
  PaidPlanTier,
  PaidTier,
  PaidTierSource,
  PaidTierStatus,
  SubscriptionTier,
} from "../api/resourceTypes";

export const isPaidTierSource = (value: unknown): value is PaidTierSource => {
  return value === "ios" || value === "android" || value === "stripe";
};

const getSourceFromStore = (
  store: EntitlementStore | undefined,
): PaidTierSource | undefined => {
  if (store === "APP_STORE") {
    return "ios";
  }
  if (store === "PLAY_STORE") {
    return "android";
  }
  if (store === "STRIPE") {
    return "stripe";
  }

  return undefined;
};

const getPaidPlanTierFromEntitlement = (
  tier: SubscriptionTier,
): PaidPlanTier | undefined => {
  if (tier === "BASIC") {
    return "basic";
  }
  if (tier === "PREMIUM") {
    return "premium";
  }

  return undefined;
};

const derivePaidTier = (entitlement: Entitlement): PaidTier => {
  const tier = getPaidPlanTierFromEntitlement(entitlement.tier);
  if (!tier) {
    return null;
  }

  const paidTier: PaidTierStatus = { tier };
  const source = getSourceFromStore(entitlement.store);
  if (source) {
    paidTier.source = source;
  }
  if (entitlement.expiresAt) {
    paidTier.expiresAt = entitlement.expiresAt;
  }

  return paidTier;
};

export const getPaidTier = (entitlement: Entitlement): PaidTier => {
  if ("paidTier" in entitlement) {
    return entitlement.paidTier ?? null;
  }

  return derivePaidTier(entitlement);
};

export const getPaidPlanLabel = (paidTier: PaidTier): string => {
  if (!paidTier) {
    return "Free";
  }
  if (paidTier.tier === "basic") {
    return "Basic";
  }

  return "Premium";
};

export const getPlanExpiresLabel = (expiresAt?: string): string | undefined => {
  if (!expiresAt) {
    return undefined;
  }

  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) {
    return expiresAt;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export const getPaidTierStoreManagementCopy = (
  source?: PaidTierSource,
): string => {
  if (source === "ios") {
    return "Manage this plan in the App Store.";
  }
  if (source === "android") {
    return "Manage this plan in Google Play.";
  }

  return "Manage this plan in the App Store or Google Play.";
};

export const isStripePaidTier = (paidTier: PaidTier): boolean => {
  return Boolean(paidTier && paidTier.source === "stripe");
};
