import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedApi } from "./authenticatedApi";
import {
  ALREADY_SUBSCRIBED_CODE,
  assignBillingUrl,
  BILLING_CHECKOUT_PATH,
  BILLING_PORTAL_PATH,
  BILLING_PRICE_NOT_FOUND_CODE,
  BILLING_REDIRECT_INVALID_CODE,
  canStartWebCheckout,
  createCheckoutSession,
  createPortalSession,
  DEFAULT_BILLING_INTERVAL,
  getAlreadySubscribedMessage,
  getBillingCheckoutErrorMessage,
  getPaidTierSourceLabel,
  isAlreadySubscribedError,
  isBillingPriceNotFoundError,
  isNotStripePlanError,
  isStoreManagedPaidTier,
  isStripeBasicPaidTier,
  normalizePaidTierSource,
  NOT_STRIPE_PLAN_CODE,
  readBillingSessionUrl,
  YEARLY_BILLING_UNAVAILABLE_MESSAGE,
} from "./billing";
import { ApiError } from "./httpClient";

const createApi = (request: AuthenticatedApi["request"]): AuthenticatedApi => {
  return {
    request,
    getMe: vi.fn(),
    deleteAccount: vi.fn(),
    clearContent: vi.fn(),
    listJobEvents: vi.fn(),
  };
};

describe("billing API", () => {
  it("posts checkout-session with the selected tier", async () => {
    const request = vi.fn().mockResolvedValue({
      url: "https://checkout.stripe.com/c/pay/cs_test",
    });
    const api = createApi(request);

    await expect(createCheckoutSession(api, "premium")).resolves.toEqual({
      url: "https://checkout.stripe.com/c/pay/cs_test",
    });
    expect(request).toHaveBeenCalledWith(BILLING_CHECKOUT_PATH, {
      method: "POST",
      body: { tier: "premium", interval: DEFAULT_BILLING_INTERVAL },
    });
  });

  it("sends monthly by default and yearly when selected for both tiers", async () => {
    const request = vi.fn().mockResolvedValue({
      url: "https://checkout.example.test/session/cs_test",
    });
    const api = createApi(request);

    await createCheckoutSession(api, "basic");
    await createCheckoutSession(api, "premium", "yearly");
    await createCheckoutSession(api, "basic", "yearly");

    expect(request).toHaveBeenNthCalledWith(1, BILLING_CHECKOUT_PATH, {
      method: "POST",
      body: { tier: "basic", interval: "monthly" },
    });
    expect(request).toHaveBeenNthCalledWith(2, BILLING_CHECKOUT_PATH, {
      method: "POST",
      body: { tier: "premium", interval: "yearly" },
    });
    expect(request).toHaveBeenNthCalledWith(3, BILLING_CHECKOUT_PATH, {
      method: "POST",
      body: { tier: "basic", interval: "yearly" },
    });
  });

  it("returns only the server checkout URL and never builds a Stripe URL", async () => {
    const request = vi.fn().mockResolvedValue({
      url: "https://checkout.example.test/session/cs_test_123",
    });
    const api = createApi(request);

    await expect(createCheckoutSession(api, "basic")).resolves.toEqual({
      url: "https://checkout.example.test/session/cs_test_123",
    });
    expect(request).toHaveBeenCalledWith(BILLING_CHECKOUT_PATH, {
      method: "POST",
      body: { tier: "basic", interval: "monthly" },
    });
    expect(JSON.stringify(request.mock.calls[0])).not.toContain("pk_live");
    expect(JSON.stringify(request.mock.calls[0])).not.toContain("pk_test");
    expect(request.mock.calls[0]?.[0]).toBe(BILLING_CHECKOUT_PATH);
  });

  it("posts portal-session without a body", async () => {
    const request = vi.fn().mockResolvedValue({
      url: "https://billing.stripe.com/p/session/test",
    });
    const api = createApi(request);

    await expect(createPortalSession(api)).resolves.toEqual({
      url: "https://billing.stripe.com/p/session/test",
    });
    expect(request).toHaveBeenCalledWith(BILLING_PORTAL_PATH, {
      method: "POST",
    });
  });

  it("never sends success, cancel, or return URLs, or window.location.origin", async () => {
    const request = vi.fn().mockResolvedValue({
      url: "https://checkout.example.test/session/cs_from_server",
    });
    const api = createApi(request);

    await createCheckoutSession(api, "basic", "monthly");
    await createCheckoutSession(api, "premium", "yearly");
    await createPortalSession(api);

    const checkoutBodies = request.mock.calls
      .filter((call) => call[0] === BILLING_CHECKOUT_PATH)
      .map((call) => call[1]?.body);
    const portalOptions = request.mock.calls.find(
      (call) => call[0] === BILLING_PORTAL_PATH,
    )?.[1];

    expect(checkoutBodies).toEqual([
      { tier: "basic", interval: "monthly" },
      { tier: "premium", interval: "yearly" },
    ]);
    for (const body of checkoutBodies) {
      expect(Object.keys(body).sort()).toEqual(["interval", "tier"]);
    }
    expect(portalOptions).toEqual({ method: "POST" });
    expect(portalOptions).not.toHaveProperty("body");

    const serialized = JSON.stringify(request.mock.calls);
    expect(serialized).not.toMatch(/success_url|cancel_url|return_url/i);
    expect(serialized).not.toMatch(/successUrl|cancelUrl|returnUrl/);
    expect(serialized).not.toContain("location.origin");
    expect(serialized).not.toContain("window.location");
  });

  it("accepts http(s) billing redirect URLs and rejects others", () => {
    expect(
      readBillingSessionUrl({ url: "https://checkout.stripe.com/c/pay/cs" }),
    ).toBe("https://checkout.stripe.com/c/pay/cs");
    expect(() => readBillingSessionUrl({ url: "javascript:alert(1)" })).toThrow(
      ApiError,
    );
    expect(() => readBillingSessionUrl({ url: "" })).toThrow(ApiError);
    expect(() => readBillingSessionUrl({ url: "" })).toThrow(
      expect.objectContaining({ code: BILLING_REDIRECT_INVALID_CODE }),
    );
  });

  it("redirects only to the URL it was given", () => {
    const assignLocation = vi.fn();
    assignBillingUrl(
      "https://checkout.example.test/session/cs_from_server",
      assignLocation,
    );

    expect(assignLocation).toHaveBeenCalledTimes(1);
    expect(assignLocation).toHaveBeenCalledWith(
      "https://checkout.example.test/session/cs_from_server",
    );
  });

  it("detects 409 billing conflict codes", () => {
    expect(
      isNotStripePlanError(
        new ApiError({
          status: 409,
          code: NOT_STRIPE_PLAN_CODE,
          source: "ios",
        }),
      ),
    ).toBe(true);
    expect(
      isAlreadySubscribedError(
        new ApiError({
          status: 409,
          code: ALREADY_SUBSCRIBED_CODE,
          source: "stripe",
        }),
      ),
    ).toBe(true);
    expect(isNotStripePlanError(new Error("nope"))).toBe(false);
    expect(isAlreadySubscribedError(new Error("nope"))).toBe(false);
    expect(
      isAlreadySubscribedError(new ApiError({ status: 400, code: "BAD_TIER" })),
    ).toBe(false);
  });

  it("maps 503 BILLING_PRICE_NOT_FOUND to the yearly unavailable message", () => {
    const missingYearlyPrice = new ApiError({
      status: 503,
      code: BILLING_PRICE_NOT_FOUND_CODE,
      message: "No Stripe price for this interval.",
    });

    expect(isBillingPriceNotFoundError(missingYearlyPrice)).toBe(true);
    expect(
      getBillingCheckoutErrorMessage(
        missingYearlyPrice,
        "Couldn't start checkout. Try again.",
      ),
    ).toBe(YEARLY_BILLING_UNAVAILABLE_MESSAGE);
    expect(
      getBillingCheckoutErrorMessage(
        new ApiError({
          status: 400,
          code: "INVALID_INTERVAL",
          message: "Unsupported billing interval.",
        }),
        "Couldn't start checkout. Try again.",
      ),
    ).toBe("Unsupported billing interval.");
  });
});

describe("already subscribed and paid-tier helpers", () => {
  it("names App Store, Google Play, and web/Stripe sources", () => {
    expect(getPaidTierSourceLabel("ios")).toBe("App Store");
    expect(getPaidTierSourceLabel("android")).toBe("Google Play");
    expect(getPaidTierSourceLabel("stripe")).toBe("web/Stripe");
    expect(getPaidTierSourceLabel(undefined)).toBe("App Store / Google Play");
    expect(getAlreadySubscribedMessage("ios")).toBe(
      "You already have a plan from the App Store.",
    );
    expect(getAlreadySubscribedMessage("android")).toBe(
      "You already have a plan from Google Play.",
    );
    expect(getAlreadySubscribedMessage("stripe")).toBe(
      "You already have a plan from web/Stripe.",
    );
    expect(normalizePaidTierSource("APP_STORE")).toBe("ios");
    expect(normalizePaidTierSource("play_store")).toBe("android");
  });

  it("treats ios, android, and a missing source as store-managed plans", () => {
    expect(isStoreManagedPaidTier({ tier: "basic", source: "ios" })).toBe(true);
    expect(isStoreManagedPaidTier({ tier: "premium", source: "android" })).toBe(
      true,
    );
    expect(isStoreManagedPaidTier({ tier: "basic" })).toBe(true);
    expect(isStoreManagedPaidTier({ tier: "basic", source: "stripe" })).toBe(
      false,
    );
    expect(isStoreManagedPaidTier(null)).toBe(false);
    expect(canStartWebCheckout({ tier: "basic" })).toBe(false);
    expect(canStartWebCheckout(null)).toBe(true);
    expect(isStripeBasicPaidTier({ tier: "basic", source: "stripe" })).toBe(
      true,
    );
    expect(isStripeBasicPaidTier({ tier: "premium", source: "stripe" })).toBe(
      false,
    );
  });
});
