import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedApi } from "./authenticatedApi";
import {
  ALREADY_SUBSCRIBED_CODE,
  BILLING_CHECKOUT_PATH,
  BILLING_PORTAL_PATH,
  createCheckoutSession,
  createPortalSession,
  isAlreadySubscribedError,
  isNotStripePlanError,
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
  });
});
