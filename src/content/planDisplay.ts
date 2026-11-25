import {
  isCompPaidTier,
  normalizePaidTierSource,
} from "../api/billing";
import {
  isPaidTierSourceValue,
  type Entitlement,
  type EntitlementStore,
  type PaidPlanTier,
  type PaidTier,
  type PaidTierSource,
  type PaidTierStatus,
  type SubscriptionTier,
} from "../api/resourceTypes";

export const isPaidTierSource = isPaidTierSourceValue;

const getSourceFromStore = (
  store: EntitlementStore | undefined,
): PaidTierSource | undefined => {
  return normalizePaidTierSource(store);
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
    const paidTier = entitlement.paidTier ?? null;
    if (!paidTier) {
      return null;
    }
    if (paidTier.source) {
      return paidTier;
    }

    const source = getSourceFromStore(entitlement.store);
    if (!source) {
      return paidTier;
    }

    return { ...paidTier, source };
  }

  return derivePaidTier(entitlement);
};

export const COMPLIMENTARY_PREMIUM_LABEL = "Premium · Complimentary";
export const COMPLIMENTARY_BASIC_LABEL = "Basic · Complimentary";

export const getPaidPlanLabel = (
  paidTier: PaidTier,
  store?: EntitlementStore,
): string => {
  if (!paidTier) {
    return "Free";
  }
  if (isCompPaidTier(paidTier, store)) {
    return paidTier.tier === "basic"
      ? COMPLIMENTARY_BASIC_LABEL
      : COMPLIMENTARY_PREMIUM_LABEL;
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
