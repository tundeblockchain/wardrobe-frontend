import { isMockApi } from "../config/mockApi";
import {
  BILLING_INTERVALS,
  type BillingInterval,
} from "./billing";
import { isApiError, request, type RequestOptions } from "./httpClient";
import { PAID_PLAN_TIERS, type PaidPlanTier } from "./resourceTypes";

export const BILLING_PLANS_PATH = "/billing/plans";
export const PLANS_UNAVAILABLE_CODE = "PLANS_UNAVAILABLE";
export const PLANS_UNAVAILABLE_MESSAGE =
  "Billing plans are temporarily unavailable.";

export type BillingPlan = {
  tier: PaidPlanTier;
  interval: BillingInterval;
  lookupKey: string;
  unitAmount: number;
  currency: string;
  productName: string;
};

export type BillingPlansResponse = {
  plans: BillingPlan[];
};

export type FetchBillingPlansFn = () => Promise<BillingPlansResponse>;

/**
 * Stripe zero-decimal currencies. Amounts are already major units, so do not
 * divide `unitAmount` by 100.
 * @see https://docs.stripe.com/currencies#zero-decimal
 */
export const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

export const MOCK_BILLING_PLANS: BillingPlan[] = [
  {
    tier: "basic",
    interval: "monthly",
    lookupKey: "wardrobe_basic_monthly",
    unitAmount: 500,
    currency: "gbp",
    productName: "Wardrobe Basic",
  },
  {
    tier: "basic",
    interval: "yearly",
    lookupKey: "wardrobe_basic_yearly",
    unitAmount: 5000,
    currency: "gbp",
    productName: "Wardrobe Basic",
  },
  {
    tier: "premium",
    interval: "monthly",
    lookupKey: "wardrobe_premium_monthly",
    unitAmount: 1500,
    currency: "gbp",
    productName: "Wardrobe Premium",
  },
  {
    tier: "premium",
    interval: "yearly",
    lookupKey: "wardrobe_premium_yearly",
    unitAmount: 15000,
    currency: "gbp",
    productName: "Wardrobe Premium",
  },
];

const isPaidPlanTier = (value: unknown): value is PaidPlanTier => {
  return (PAID_PLAN_TIERS as readonly string[]).includes(String(value));
};

const isBillingInterval = (value: unknown): value is BillingInterval => {
  return (BILLING_INTERVALS as readonly string[]).includes(String(value));
};

export const isPlansUnavailableError = (error: unknown): boolean => {
  return (
    isApiError(error) &&
    error.status === 503 &&
    error.code === PLANS_UNAVAILABLE_CODE
  );
};

export const getPlansUnavailableMessage = (error: unknown): string => {
  if (isApiError(error)) {
    const serverMessage = error.message.trim();
    if (serverMessage) {
      return serverMessage;
    }
  }

  return PLANS_UNAVAILABLE_MESSAGE;
};

export const getBillingMajorAmount = (
  unitAmount: number,
  currency: string,
): number => {
  const normalizedCurrency = currency.trim().toLowerCase();
  if (ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency)) {
    return unitAmount;
  }

  return unitAmount / 100;
};

export const formatBillingPrice = (
  unitAmount: number,
  currency: string,
): string => {
  const normalizedCurrency = currency.trim().toLowerCase();
  const amount = getBillingMajorAmount(unitAmount, normalizedCurrency);

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizedCurrency.toUpperCase(),
    }).format(amount);
  } catch {
    return `${amount} ${normalizedCurrency.toUpperCase()}`;
  }
};

export const readBillingPlan = (value: unknown): BillingPlan | undefined => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as {
    tier?: unknown;
    interval?: unknown;
    lookupKey?: unknown;
    unitAmount?: unknown;
    currency?: unknown;
    productName?: unknown;
  };

  if (!isPaidPlanTier(record.tier) || !isBillingInterval(record.interval)) {
    return undefined;
  }

  if (typeof record.lookupKey !== "string" || record.lookupKey.trim() === "") {
    return undefined;
  }

  if (typeof record.unitAmount !== "number" || !Number.isFinite(record.unitAmount)) {
    return undefined;
  }

  if (typeof record.currency !== "string" || record.currency.trim() === "") {
    return undefined;
  }

  if (typeof record.productName !== "string") {
    return undefined;
  }

  return {
    tier: record.tier,
    interval: record.interval,
    lookupKey: record.lookupKey.trim(),
    unitAmount: record.unitAmount,
    currency: record.currency.trim().toLowerCase(),
    productName: record.productName,
  };
};

export const normalizeBillingPlansResponse = (
  value: unknown,
): BillingPlansResponse => {
  if (!value || typeof value !== "object") {
    return { plans: [] };
  }

  const plans = (value as { plans?: unknown }).plans;
  if (!Array.isArray(plans)) {
    return { plans: [] };
  }

  return {
    plans: plans.flatMap((plan) => {
      const parsed = readBillingPlan(plan);
      return parsed ? [parsed] : [];
    }),
  };
};

export const findBillingPlan = (
  plans: readonly BillingPlan[],
  tier: PaidPlanTier,
  interval: BillingInterval,
): BillingPlan | undefined => {
  return plans.find(
    (plan) => plan.tier === tier && plan.interval === interval,
  );
};

export const fetchBillingPlans = async (
  options: RequestOptions = {},
): Promise<BillingPlansResponse> => {
  if (isMockApi()) {
    return { plans: MOCK_BILLING_PLANS };
  }

  const payload = await request<unknown>(BILLING_PLANS_PATH, {
    method: "GET",
    credentials: "omit",
    ...options,
  });

  return normalizeBillingPlansResponse(payload);
};
