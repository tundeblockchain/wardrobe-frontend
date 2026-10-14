import type { AuthenticatedApi } from "./authenticatedApi";
import { ApiError } from "./httpClient";
import type { PaidPlanTier } from "./resourceTypes";

export const BILLING_CHECKOUT_PATH = "/billing/checkout-session";
export const BILLING_PORTAL_PATH = "/billing/portal-session";

export const NOT_STRIPE_PLAN_CODE = "NOT_STRIPE_PLAN";
export const ALREADY_SUBSCRIBED_CODE = "ALREADY_SUBSCRIBED";
export const BILLING_CANCEL_FAILED_CODE = "BILLING_CANCEL_FAILED";

export type BillingSession = {
  url: string;
};

export type CheckoutTier = PaidPlanTier;

export const isNotStripePlanError = (error: unknown): boolean => {
  return error instanceof ApiError && error.code === NOT_STRIPE_PLAN_CODE;
};

export const isAlreadySubscribedError = (error: unknown): boolean => {
  return error instanceof ApiError && error.code === ALREADY_SUBSCRIBED_CODE;
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
      code: "BILLING_REDIRECT_INVALID",
      message: "Billing redirect URL is missing.",
    });
  }

  return url;
};

export const assignBillingUrl = (url: string): void => {
  window.location.assign(url);
};

export const createCheckoutSession = (
  api: AuthenticatedApi,
  tier: CheckoutTier,
): Promise<BillingSession> => {
  return api.request<BillingSession>(BILLING_CHECKOUT_PATH, {
    method: "POST",
    body: { tier },
  });
};

export const createPortalSession = (
  api: AuthenticatedApi,
): Promise<BillingSession> => {
  return api.request<BillingSession>(BILLING_PORTAL_PATH, {
    method: "POST",
  });
};
