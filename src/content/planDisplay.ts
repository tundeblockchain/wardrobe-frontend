import type {
  Entitlement,
  EntitlementPeriod,
  EntitlementStatus,
  EntitlementStore,
  SubscriptionTier,
} from "../api/resourceTypes";

export const getPlanTierLabel = (tier: SubscriptionTier): string => {
  if (tier === "BASIC") {
    return "Basic";
  }
  if (tier === "PREMIUM") {
    return "Premium";
  }

  return "Free";
};

export const getPlanStatusLabel = (status: EntitlementStatus): string => {
  if (status === "ACTIVE") {
    return "Active";
  }
  if (status === "CANCELED") {
    return "Canceled";
  }
  if (status === "BILLING_ISSUE") {
    return "Billing issue";
  }
  if (status === "PAUSED") {
    return "Paused";
  }
  if (status === "EXPIRED") {
    return "Expired";
  }

  return "None";
};

export const getPlanStoreLabel = (
  store: EntitlementStore | undefined,
): string => {
  if (store === "APP_STORE") {
    return "App Store";
  }
  if (store === "PLAY_STORE") {
    return "Google Play";
  }
  if (store === "STRIPE") {
    return "Web";
  }

  return "Unknown";
};

export const getPlanPeriodLabel = (
  period: EntitlementPeriod | undefined,
): string | undefined => {
  if (period === "MONTHLY") {
    return "Monthly";
  }
  if (period === "YEARLY") {
    return "Yearly";
  }

  return undefined;
};

export const shouldManagePlanInApp = (
  store: EntitlementStore | undefined,
): boolean => {
  return store === "APP_STORE" || store === "PLAY_STORE";
};

export const getPlanManagementCopy = (entitlement: Entitlement): string => {
  if (shouldManagePlanInApp(entitlement.store)) {
    if (entitlement.store === "APP_STORE") {
      return "This plan was bought on the App Store. Manage it in the iOS app.";
    }

    return "This plan was bought on Google Play. Manage it in the Android app.";
  }

  if (entitlement.store === "STRIPE") {
    return "This plan was bought on the web. Payment management is not available here.";
  }

  if (entitlement.tier === "FREE") {
    return "The Free plan is included with the account.";
  }

  return "Purchase location is not available.";
};
