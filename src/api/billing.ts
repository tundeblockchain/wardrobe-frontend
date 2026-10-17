import {
  alreadySubscribedCopy,
  getStripeAlreadySubscribedMessage,
} from "../content/alreadySubscribed";
import type { AuthenticatedApi } from "./authenticatedApi";
import { ApiError, isApiError } from "./httpClient";
import type { PaidPlanTier, PaidTier, PaidTierSource } from "./resourceTypes";

export const BILLING_CHECKOUT_PATH = "/billing/checkout-session";
export const BILLING_PORTAL_PATH = "/billing/portal-session";

export const NOT_STRIPE_PLAN_CODE = "NOT_STRIPE_PLAN";
export const ALREADY_SUBSCRIBED_CODE = "ALREADY_SUBSCRIBED";
export const BILLING_CANCEL_FAILED_CODE = "BILLING_CANCEL_FAILED";
export const BILLING_REDIRECT_INVALID_CODE = "BILLING_REDIRECT_INVALID";
export const BILLING_PRICE_NOT_FOUND_CODE = "BILLING_PRICE_NOT_FOUND";

export const BILLING_INTERVALS = ["monthly", "yearly"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];
export const DEFAULT_BILLING_INTERVAL: BillingInterval = "monthly";

export const YEARLY_BILLING_UNAVAILABLE_MESSAGE =
  "Yearly billing isn't available right now. Try monthly.";

export type BillingSession = {
  url: string;
};

export type CheckoutTier = PaidPlanTier;

export type CheckoutSessionBody = {
  tier: CheckoutTier;
  interval: BillingInterval;
};

export const isNotStripePlanError = (error: unknown): boolean => {
  return error instanceof ApiError && error.code === NOT_STRIPE_PLAN_CODE;
};

export const isAlreadySubscribedError = (error: unknown): error is ApiError => {
  return (
    isApiError(error) &&
    error.status === 409 &&
    error.code === ALREADY_SUBSCRIBED_CODE
  );
};

export const isBillingPriceNotFoundError = (
  error: unknown,
): error is ApiError => {
  return (
    isApiError(error) &&
    error.status === 503 &&
    error.code === BILLING_PRICE_NOT_FOUND_CODE
  );
};

export const getBillingCheckoutErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (isBillingPriceNotFoundError(error)) {
    return YEARLY_BILLING_UNAVAILABLE_MESSAGE;
  }

  if (isApiError(error)) {
    const serverMessage = error.message.trim();
    if (serverMessage) {
      return serverMessage;
    }
  }

  return fallback;
};

const isHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

export const readBillingSessionUrl = (session: BillingSession): string => {
  const url = session.url?.trim() ?? "";
  if (!isHttpUrl(url)) {
    throw new ApiError({
      status: 0,
      code: BILLING_REDIRECT_INVALID_CODE,
      message: "Billing redirect URL is missing.",
    });
  }

  return url;
};

export const assignBillingUrl = (
  url: string,
  assignLocation: (nextUrl: string) => void = (nextUrl) => {
    window.location.assign(nextUrl);
  },
): void => {
  assignLocation(url);
};

export const createCheckoutSession = (
  api: AuthenticatedApi,
  tier: CheckoutTier,
  interval: BillingInterval = DEFAULT_BILLING_INTERVAL,
): Promise<BillingSession> => {
  const body: CheckoutSessionBody = { tier, interval };
  return api.request<BillingSession>(BILLING_CHECKOUT_PATH, {
    method: "POST",
    body,
  });
};

export const createPortalSession = (
  api: AuthenticatedApi,
): Promise<BillingSession> => {
  return api.request<BillingSession>(BILLING_PORTAL_PATH, {
    method: "POST",
  });
};

export const normalizePaidTierSource = (
  value: string | undefined | null,
): PaidTierSource | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "ios" || normalized === "app_store") {
    return "ios";
  }
  if (normalized === "android" || normalized === "play_store") {
    return "android";
  }
  if (normalized === "stripe" || normalized === "web") {
    return "stripe";
  }

  return undefined;
};

export const isStoreManagedPaidTier = (
  paidTier: PaidTier | undefined,
): boolean => {
  if (!paidTier) {
    return false;
  }

  if (paidTier.source === "stripe") {
    return false;
  }

  return (
    paidTier.source === "ios" ||
    paidTier.source === "android" ||
    !paidTier.source
  );
};

export const isStripeBasicPaidTier = (
  paidTier: PaidTier | undefined,
): boolean => {
  if (!paidTier || paidTier.source !== "stripe") {
    return false;
  }

  return paidTier.tier.trim().toLowerCase() === "basic";
};

export const canStartWebCheckout = (
  paidTier: PaidTier | undefined,
): boolean => {
  return !isStoreManagedPaidTier(paidTier);
};

export const getPaidTierSourceLabel = (
  source: PaidTierSource | string | undefined,
): string => {
  const normalized = normalizePaidTierSource(source);
  if (normalized === "ios") {
    return "App Store";
  }
  if (normalized === "android") {
    return "Google Play";
  }
  if (normalized === "stripe") {
    return "web/Stripe";
  }

  return "App Store / Google Play";
};

export const getAlreadySubscribedMessage = (
  source: PaidTierSource | string | undefined,
): string => {
  const normalized = normalizePaidTierSource(source);
  if (normalized === "ios") {
    return alreadySubscribedCopy.ios;
  }
  if (normalized === "android") {
    return alreadySubscribedCopy.android;
  }
  if (normalized === "stripe") {
    return getStripeAlreadySubscribedMessage();
  }

  return alreadySubscribedCopy.unknown;
};

export const resolvePaidTierSource = (
  paidTier: PaidTier | undefined,
  error?: unknown,
): PaidTierSource | undefined => {
  if (paidTier) {
    return paidTier.source;
  }

  if (isApiError(error)) {
    return normalizePaidTierSource(error.source);
  }

  return undefined;
};
