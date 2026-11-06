import type { Page, Route } from "@playwright/test";
import { E2E_API_ORIGIN, E2E_USER_ID } from "./env";
import { weekendWardrobe, type E2EWardrobe } from "./wishlistApiMock";

const nowIso = "2026-11-06T12:00:00.000Z";
const UPLOAD_ORIGIN = "https://uploads.pocketcloset.test";

export type TrackingApiState = {
  subscribed: boolean;
  wardrobes: E2EWardrobe[];
  items: Array<{
    itemId: string;
    wardrobeId: string;
    name: string;
    category: string;
    processingStatus: string;
    originalImageUrl?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  outfits: Array<{
    outfitId: string;
    wardrobeId: string;
    name: string;
    items: Array<{ itemId: string; slot: string }>;
    createdAt: string;
    updatedAt: string;
  }>;
  wishes: Array<{
    wishId: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

const premiumEntitlement = {
  userId: E2E_USER_ID,
  tier: "PREMIUM",
  status: "ACTIVE",
  features: {
    unlimitedCatalog: true,
    aiTryOn: true,
    otherAi: true,
  },
  limits: null,
  usage: { wardrobes: 1, items: 1, outfits: 0 },
  paidTier: { tier: "premium", source: "stripe" },
  updatedAt: nowIso,
};

const freeEntitlement = {
  userId: E2E_USER_ID,
  tier: "FREE",
  status: "NONE",
  features: {
    unlimitedCatalog: false,
    aiTryOn: false,
    otherAi: false,
  },
  limits: { wardrobes: 5, items: 20, outfits: 20 },
  usage: { wardrobes: 1, items: 1, outfits: 0 },
  paidTier: null,
  updatedAt: nowIso,
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
      tier: "premium",
      interval: "monthly",
      lookupKey: "wardrobe_premium_monthly",
      unitAmount: 1500,
      currency: "gbp",
      productName: "Wardrobe Premium",
    },
  ],
};

const fulfillJson = async (
  route: Route,
  status: number,
  body: unknown,
): Promise<void> => {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
};

const readJsonBody = (route: Route): Record<string, unknown> => {
  const raw = route.request().postData();
  if (!raw) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }

  return {};
};

export const installTrackingApiMocks = async (
  page: Page,
  options: {
    checkoutSuccessUrl?: string;
    startSubscribed?: boolean;
  } = {},
): Promise<TrackingApiState> => {
  const state: TrackingApiState = {
    subscribed: Boolean(options.startSubscribed),
    wardrobes: [{ ...weekendWardrobe }],
    items: [
      {
        itemId: "item_navytee01",
        wardrobeId: weekendWardrobe.wardrobeId,
        name: "Navy tee",
        category: "TOP",
        processingStatus: "READY",
        originalImageUrl: "/screenshots/item-detail-390.jpg",
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ],
    outfits: [],
    wishes: [],
  };

  await page.route(`${UPLOAD_ORIGIN}/**`, async (route) => {
    await route.fulfill({ status: 200, body: "" });
  });

  await page.route(
    (url) => url.origin === E2E_API_ORIGIN,
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const method = request.method();
      const path = url.pathname;
      const body = readJsonBody(route);

      if (method === "GET" && path === "/me") {
        await fulfillJson(
          route,
          200,
          state.subscribed ? premiumEntitlement : freeEntitlement,
        );
        return;
      }

      if (method === "GET" && path === "/billing/plans") {
        await fulfillJson(route, 200, billingPlans);
        return;
      }

      if (method === "POST" && path === "/billing/checkout-session") {
        state.subscribed = true;
        const requestOrigin = request.headers()["origin"];
        const successUrl =
          options.checkoutSuccessUrl ??
          `${requestOrigin ?? "http://127.0.0.1:4173"}/app/billing/success?session_id=cs_test_e2e`;
        await fulfillJson(route, 200, { url: successUrl });
        return;
      }

      if (method === "GET" && path === "/wardrobes") {
        await fulfillJson(route, 200, { wardrobes: state.wardrobes });
        return;
      }

      if (method === "POST" && path === "/wardrobes") {
        const created: E2EWardrobe = {
          wardrobeId: `wd_${state.wardrobes.length + 1}`,
          name: typeof body.name === "string" ? body.name : "Wardrobe",
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        state.wardrobes.push(created);
        await fulfillJson(route, 200, created);
        return;
      }

      const wardrobeMatch = path.match(/^\/wardrobes\/([^/]+)$/);
      if (method === "GET" && wardrobeMatch) {
        const wardrobe = state.wardrobes.find(
          (entry) => entry.wardrobeId === decodeURIComponent(wardrobeMatch[1] ?? ""),
        );
        if (!wardrobe) {
          await fulfillJson(route, 404, {
            error: { code: "WARDROBE_NOT_FOUND", message: "Not found." },
          });
          return;
        }
        await fulfillJson(route, 200, wardrobe);
        return;
      }

      const wardrobeItemsMatch = path.match(/^\/wardrobes\/([^/]+)\/items$/);
      if (method === "GET" && wardrobeItemsMatch) {
        const wardrobeId = decodeURIComponent(wardrobeItemsMatch[1] ?? "");
        await fulfillJson(route, 200, {
          items: state.items.filter((item) => item.wardrobeId === wardrobeId),
        });
        return;
      }

      if (method === "POST" && wardrobeItemsMatch) {
        const wardrobeId = decodeURIComponent(wardrobeItemsMatch[1] ?? "");
        const created = {
          itemId: `item_${state.items.length + 1}`,
          wardrobeId,
          name: typeof body.name === "string" ? body.name : "Item",
          category: typeof body.category === "string" ? body.category : "TOP",
          processingStatus: "READY",
          originalImageUrl: "/screenshots/item-detail-390.jpg",
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        state.items.push(created);
        await fulfillJson(route, 200, created);
        return;
      }

      const itemMatch = path.match(/^\/items\/([^/]+)$/);
      if (method === "GET" && itemMatch) {
        const item = state.items.find(
          (entry) => entry.itemId === decodeURIComponent(itemMatch[1] ?? ""),
        );
        if (!item) {
          await fulfillJson(route, 404, {
            error: { code: "ITEM_NOT_FOUND", message: "Not found." },
          });
          return;
        }
        await fulfillJson(route, 200, item);
        return;
      }

      if (method === "POST" && path === "/uploads") {
        await fulfillJson(route, 200, {
          uploadUrl: `${UPLOAD_ORIGIN}/presigned`,
          objectKey: "users/e2e/uploads/item.jpg",
          expiresIn: 900,
        });
        return;
      }

      if (method === "GET" && path === "/outfits") {
        await fulfillJson(route, 200, { outfits: state.outfits });
        return;
      }

      const wardrobeOutfitsMatch = path.match(/^\/wardrobes\/([^/]+)\/outfits$/);
      if (method === "POST" && wardrobeOutfitsMatch) {
        const wardrobeId = decodeURIComponent(wardrobeOutfitsMatch[1] ?? "");
        const created = {
          outfitId: `outfit_${state.outfits.length + 1}`,
          wardrobeId,
          name: typeof body.name === "string" ? body.name : "Outfit",
          items: Array.isArray(body.items)
            ? (body.items as Array<{ itemId: string; slot: string }>)
            : [],
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        state.outfits.push(created);
        await fulfillJson(route, 200, created);
        return;
      }

      if (method === "GET" && path === "/wishlist") {
        await fulfillJson(route, 200, { wishes: state.wishes });
        return;
      }

      if (method === "POST" && path === "/wishlist") {
        const created = {
          wishId: `wish_${state.wishes.length + 1}`,
          name: typeof body.name === "string" ? body.name : "Wish",
          category:
            typeof body.category === "string" ? body.category : "OUTERWEAR",
          originalImageUrl: "/screenshots/item-detail-390.jpg",
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        state.wishes.push(created);
        await fulfillJson(route, 200, created);
        return;
      }

      const acquireMatch = path.match(/^\/wishlist\/([^/]+)\/acquire$/);
      if (method === "POST" && acquireMatch) {
        const wishId = decodeURIComponent(acquireMatch[1] ?? "");
        state.wishes = state.wishes.filter((wish) => wish.wishId !== wishId);
        await fulfillJson(route, 200, {
          itemId: "item_acquired",
          wardrobeId:
            typeof body.wardrobeId === "string"
              ? body.wardrobeId
              : weekendWardrobe.wardrobeId,
        });
        return;
      }

      await fulfillJson(route, 404, {
        error: { code: "NOT_FOUND", message: path },
      });
    },
  );

  return state;
};
