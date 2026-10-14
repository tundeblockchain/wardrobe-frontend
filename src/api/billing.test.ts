import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedApi } from "./authenticatedApi";
import {
  ALREADY_SUBSCRIBED_CODE,
  assignBillingUrl,
  BILLING_CHECKOUT_PATH,
  BILLING_PORTAL_PATH,
  BILLING_REDIRECT_INVALID_CODE,
  canStartWebCheckout,
  createCheckoutSession,
  createPortalSession,
  getAlreadySubscribedMessage,
  getPaidTierSourceLabel,
  isAlreadySubscribedError,
  isNotStripePlanError,
  isStoreManagedPaidTier,
  isStripeBasicPaidTier,
  normalizePaidTierSource,
  NOT_STRIPE_PLAN_CODE,
  readBillingSessionUrl,
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
      body: { tier: "premium" },
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
      body: { tier: "basic" },
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
