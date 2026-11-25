/**
 * Playwright network fixtures for WARDROBE-292 complimentary Premium.
 * GET /me returns the backend WARDROBE-291 comp shape: store COMP,
 * paidTier.source comp, no expiresAt.
 */
import type { Page, Route } from "@playwright/test";
import { E2E_API_ORIGIN, E2E_USER_ID } from "./env";

const nowIso = "2026-11-01T00:00:00.000Z";

export const compPremiumEntitlement = {
  userId: E2E_USER_ID,
  tier: "PREMIUM",
  status: "ACTIVE",
  features: {
    unlimitedCatalog: true,
    aiTryOn: true,
    otherAi: true,
  },
  limits: null,
  usage: {
    wardrobes: 0,
    items: 0,
    outfits: 0,
  },
  store: "COMP",
  updatedAt: nowIso,
  paidTier: {
    tier: "premium",
    source: "comp",
  },
};

const billingPlans = {
  plans: [
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
  ],
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type,Accept",
};

const fulfillJson = async (
  route: Route,
  status: number,
  body: unknown,
): Promise<void> => {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  });
};

export type CompPremiumMockState = {
  checkoutCalls: number;
  portalCalls: number;
};

export const installCompPremiumApiMocks = async (
  page: Page,
  entitlement: Record<string, unknown> = compPremiumEntitlement,
): Promise<CompPremiumMockState> => {
  const state: CompPremiumMockState = {
    checkoutCalls: 0,
    portalCalls: 0,
  };

  await page.route(
    (url) => url.origin === E2E_API_ORIGIN,
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const method = request.method();
      const path = url.pathname;

      if (method === "OPTIONS") {
        await route.fulfill({
          status: 204,
          headers: CORS_HEADERS,
        });
        return;
      }

      if (method === "GET" && path === "/me") {
        await fulfillJson(route, 200, entitlement);
        return;
      }

      if (method === "GET" && path === "/billing/plans") {
        await fulfillJson(route, 200, billingPlans);
        return;
      }

      if (method === "POST" && path === "/billing/checkout-session") {
        state.checkoutCalls += 1;
        await fulfillJson(route, 409, {
          error: {
            code: "ALREADY_SUBSCRIBED",
            message: "Already subscribed.",
            source: "comp",
          },
        });
        return;
      }

      if (method === "POST" && path === "/billing/portal-session") {
        state.portalCalls += 1;
        await fulfillJson(route, 409, {
          error: {
            code: "NOT_STRIPE_PLAN",
            message: "Manage plan is only available for Stripe subscriptions.",
            source: "comp",
          },
        });
        return;
      }

      if (method === "GET" && path === "/wardrobes") {
        await fulfillJson(route, 200, { wardrobes: [] });
        return;
      }

      if (method === "GET" && path === "/wishlist") {
        await fulfillJson(route, 200, { wishes: [] });
        return;
      }

      if (method === "GET" && path === "/ai-profiles") {
        await fulfillJson(route, 200, { aiProfiles: [] });
        return;
      }

      if (method === "GET" && path === "/ai-profiles/models") {
        await fulfillJson(route, 200, { aiProfiles: [] });
        return;
      }

      await fulfillJson(route, 404, {
        error: { code: "NOT_FOUND", message: "Not found." },
      });
    },
  );

  return state;
};
