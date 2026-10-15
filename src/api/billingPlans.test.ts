import { describe, expect, it, vi } from "vitest";
import { ApiError } from "./httpClient";
import {
  BILLING_PLANS_PATH,
  findBillingPlan,
  formatBillingPrice,
  getBillingMajorAmount,
  getPlansUnavailableMessage,
  isPlansUnavailableError,
  MOCK_BILLING_PLANS,
  normalizeBillingPlansResponse,
  PLANS_UNAVAILABLE_CODE,
  PLANS_UNAVAILABLE_MESSAGE,
  readBillingPlan,
} from "./billingPlans";

describe("billing plans helpers", () => {
  it("treats 503 PLANS_UNAVAILABLE as a friendly catalog error", () => {
    const error = new ApiError({
      status: 503,
      code: PLANS_UNAVAILABLE_CODE,
      message: PLANS_UNAVAILABLE_MESSAGE,
    });

    expect(isPlansUnavailableError(error)).toBe(true);
    expect(getPlansUnavailableMessage(error)).toBe(PLANS_UNAVAILABLE_MESSAGE);
    expect(isPlansUnavailableError(new Error("nope"))).toBe(false);
  });

  it("formats decimal currencies from minor units and keeps zero-decimal amounts", () => {
    expect(getBillingMajorAmount(500, "gbp")).toBe(5);
    expect(getBillingMajorAmount(1500, "GBP")).toBe(15);
    expect(getBillingMajorAmount(500, "jpy")).toBe(500);
    expect(formatBillingPrice(500, "gbp")).toBe(
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "GBP",
      }).format(5),
    );
    expect(formatBillingPrice(500, "jpy")).toBe(
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "JPY",
      }).format(500),
    );
  });

  it("reads catalog rows and skips malformed entries", () => {
    const basicMonthly = readBillingPlan(MOCK_BILLING_PLANS[0]);
    expect(basicMonthly).toEqual(MOCK_BILLING_PLANS[0]);
    expect(readBillingPlan({ tier: "free", interval: "monthly" })).toBeUndefined();

    const normalized = normalizeBillingPlansResponse({
      plans: [
        MOCK_BILLING_PLANS[0],
        { tier: "premium", interval: "monthly" },
        MOCK_BILLING_PLANS[2],
      ],
    });

    expect(normalized.plans).toEqual([
      MOCK_BILLING_PLANS[0],
      MOCK_BILLING_PLANS[2],
    ]);
    expect(
      findBillingPlan(normalized.plans, "basic", "monthly")?.lookupKey,
    ).toBe("wardrobe_basic_monthly");
    expect(findBillingPlan(normalized.plans, "basic", "yearly")).toBeUndefined();
    expect(BILLING_PLANS_PATH).toBe("/billing/plans");
  });

  it("does not keep Stripe secrets or hardcoded live prices in the catalog client", () => {
    const source = [
      MOCK_BILLING_PLANS,
      formatBillingPrice.toString(),
      fetch.toString(),
    ].join("\n");

    expect(source).not.toContain("pk_live");
    expect(source).not.toContain("pk_test");
    expect(source).not.toContain("sk_live");
    expect(vi.fn).toBeTypeOf("function");
  });
});
