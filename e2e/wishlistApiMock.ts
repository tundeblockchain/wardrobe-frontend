/**
 * TODO(WARDROBE-244): Confirm these request/response fixtures against the
 * backend contract in WARDROBE-244 before pointing this Playwright mock at
 * the live API. Paths, wrappers (`wishes` vs `items`), the 500-wish cap,
 * acquire `{ wardrobeId }` payload, item-cap error `ENTITLEMENT_ITEM_LIMIT`,
 * and GET /me + GET /wardrobes shapes must match that ticket.
 *
 * Until then, this helper intercepts the same routes the web client uses
 * (`GET/POST /wishlist`, `PATCH/DELETE /wishlist/{id}`,
 * `POST /wishlist/{id}/acquire`) at the network layer with page.route().
 */
import type { Page, Request, Route } from "@playwright/test";
import { E2E_API_ORIGIN, E2E_USER_ID } from "./env";

export const ITEM_CAP_CODE = "ENTITLEMENT_ITEM_LIMIT";

export type E2EWish = {
  wishId: string;
  name: string;
  category?: string;
  subcategory?: string;
  imageUrl?: string;
  linkUrl?: string;
  price?: number;
  currency?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type E2EWardrobe = {
  wardrobeId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
};

export type WishlistMockOptions = {
  wishes?: E2EWish[];
  wardrobes?: E2EWardrobe[];
  listDelayMs?: number;
  acquireItemCap?: boolean;
};

const nowIso = "2026-10-13T12:00:00.000Z";

export const httpsWish: E2EWish = {
  wishId: "wish_loafers01",
  name: "Black loafers",
  category: "SHOES",
  subcategory: "LOAFER",
  imageUrl: "/screenshots/item-detail-390.jpg",
  linkUrl: "https://example.com/black-loafers",
  price: 145,
  currency: "GBP",
  notes: "For work days.",
  createdAt: "2026-10-12T09:00:00.000Z",
  updatedAt: "2026-10-12T09:00:00.000Z",
};

export const unsafeLinkWish: E2EWish = {
  wishId: "wish_script01",
  name: "Unsafe link coat",
  category: "OUTERWEAR",
  linkUrl: "javascript:alert(1)",
  createdAt: "2026-10-11T09:00:00.000Z",
  updatedAt: "2026-10-11T09:00:00.000Z",
};

export const httpLinkWish: E2EWish = {
  wishId: "wish_http01",
  name: "Http link bag",
  category: "BAG",
  linkUrl: "http://example.com/bag",
  createdAt: "2026-10-10T09:00:00.000Z",
  updatedAt: "2026-10-10T09:00:00.000Z",
};

export const populatedWishes: E2EWish[] = [
  httpsWish,
  unsafeLinkWish,
  httpLinkWish,
];

export const weekendWardrobe: E2EWardrobe = {
  wardrobeId: "wd_weekend01",
  name: "Weekend closet",
  createdAt: "2026-09-03T18:35:00.000Z",
  updatedAt: "2026-10-01T09:12:00.000Z",
  imageUrl: "/screenshots/home-390.jpg",
};

export const workWardrobe: E2EWardrobe = {
  wardrobeId: "wd_work02",
  name: "Workwear",
  createdAt: "2026-09-12T11:00:00.000Z",
  updatedAt: "2026-09-28T16:44:00.000Z",
  imageUrl: "/screenshots/try-on-blue-mini-390.jpg",
};

const freeAtItemCapEntitlement = {
  userId: E2E_USER_ID,
  tier: "FREE",
  status: "NONE",
  features: {
    unlimitedCatalog: false,
    aiTryOn: false,
    otherAi: false,
  },
  limits: {
    wardrobes: 1,
    items: 5,
    outfits: 5,
  },
  usage: {
    wardrobes: 1,
    items: 5,
    outfits: 5,
  },
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

const fulfillError = async (
  route: Route,
  status: number,
  code: string,
  message: string,
): Promise<void> => {
  await fulfillJson(route, status, { error: { code, message } });
};

const cloneWish = (wish: E2EWish): E2EWish => {
  return { ...wish };
};

const readJsonBody = (request: Request): Record<string, unknown> => {
  const raw = request.postData();
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

const readString = (
  body: Record<string, unknown>,
  key: string,
): string | undefined => {
  const value = body[key];
  return typeof value === "string" ? value : undefined;
};

export const installWishlistApiMocks = async (
  page: Page,
  options: WishlistMockOptions = {},
): Promise<void> => {
  const wishes = (options.wishes ?? populatedWishes).map(cloneWish);
  const wardrobes = options.wardrobes ?? [weekendWardrobe, workWardrobe];
  let nextWishNumber = wishes.length + 1;

  await page.route(
    (url) => url.origin === E2E_API_ORIGIN,
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const method = request.method();
      const path = url.pathname;
      const acquireMatch = path.match(/^\/wishlist\/([^/]+)\/acquire$/);
      const wishMatch = path.match(/^\/wishlist\/([^/]+)$/);

      if (method === "GET" && path === "/me") {
        await fulfillJson(route, 200, freeAtItemCapEntitlement);
        return;
      }

      if (method === "GET" && path === "/billing/plans") {
        await fulfillJson(route, 200, billingPlans);
        return;
      }

      if (method === "GET" && path === "/wardrobes") {
        await fulfillJson(route, 200, { wardrobes });
        return;
      }

      if (method === "GET" && /^\/wardrobes\/[^/]+\/items$/.test(path)) {
        await fulfillJson(route, 200, { items: [] });
        return;
      }

      if (method === "GET" && path === "/wishlist") {
        if (options.listDelayMs && options.listDelayMs > 0) {
          await new Promise((resolve) => {
            setTimeout(resolve, options.listDelayMs);
          });
        }
        await fulfillJson(route, 200, {
          wishes: wishes.map(cloneWish),
        });
        return;
      }

      if (method === "POST" && acquireMatch) {
        const wishId = decodeURIComponent(acquireMatch[1] ?? "");
        if (options.acquireItemCap) {
          await fulfillError(
            route,
            403,
            ITEM_CAP_CODE,
            "This plan has reached its clothing item limit.",
          );
          return;
        }

        const body = readJsonBody(request);
        const wardrobeId = readString(body, "wardrobeId")?.trim() ?? "";
        const index = wishes.findIndex((wish) => wish.wishId === wishId);
        if (index < 0) {
          await fulfillError(route, 404, "WISH_NOT_FOUND", "Wish not found.");
          return;
        }

        const [removed] = wishes.splice(index, 1);
        await fulfillJson(route, 200, {
          wishId,
          wardrobeId,
          item: {
            itemId: `item_from_${wishId}`,
            wardrobeId,
            name: removed?.name ?? "Acquired wish",
            category: removed?.category ?? "ACCESSORY",
            processingStatus: "READY",
            createdAt: nowIso,
            updatedAt: nowIso,
          },
        });
        return;
      }

      if (method === "POST" && path === "/wishlist") {
        const body = readJsonBody(request);
        const name = readString(body, "name")?.trim() ?? "";
        const wish: E2EWish = {
          wishId: `wish_new_${nextWishNumber}`,
          name,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        nextWishNumber += 1;
        const category = readString(body, "category");
        if (category) {
          wish.category = category;
        }
        const subcategory = readString(body, "subcategory");
        if (subcategory) {
          wish.subcategory = subcategory;
        }
        const linkUrl = readString(body, "linkUrl");
        if (linkUrl) {
          wish.linkUrl = linkUrl;
        }
        const notes = readString(body, "notes");
        if (notes) {
          wish.notes = notes;
        }
        if (typeof body.price === "number") {
          wish.price = body.price;
        }
        const currency = readString(body, "currency");
        if (currency) {
          wish.currency = currency;
        }
        wishes.unshift(wish);
        await fulfillJson(route, 200, cloneWish(wish));
        return;
      }

      if (method === "PATCH" && wishMatch) {
        const wishId = decodeURIComponent(wishMatch[1] ?? "");
        const wish = wishes.find((entry) => entry.wishId === wishId);
        if (!wish) {
          await fulfillError(route, 404, "WISH_NOT_FOUND", "Wish not found.");
          return;
        }

        const body = readJsonBody(request);
        const name = readString(body, "name");
        if (name !== undefined) {
          wish.name = name.trim();
        }
        const category = readString(body, "category");
        if (category !== undefined) {
          wish.category = category;
        }
        const subcategory = readString(body, "subcategory");
        if (subcategory !== undefined) {
          wish.subcategory = subcategory;
        }
        const linkUrl = readString(body, "linkUrl");
        if (linkUrl !== undefined) {
          wish.linkUrl = linkUrl;
        }
        const notes = readString(body, "notes");
        if (notes !== undefined) {
          wish.notes = notes;
        }
        if (typeof body.price === "number") {
          wish.price = body.price;
        }
        const currency = readString(body, "currency");
        if (currency !== undefined) {
          wish.currency = currency;
        }
        wish.updatedAt = nowIso;
        await fulfillJson(route, 200, cloneWish(wish));
        return;
      }

      if (method === "DELETE" && wishMatch) {
        const wishId = decodeURIComponent(wishMatch[1] ?? "");
        const index = wishes.findIndex((wish) => wish.wishId === wishId);
        if (index < 0) {
          await fulfillError(route, 404, "WISH_NOT_FOUND", "Wish not found.");
          return;
        }

        wishes.splice(index, 1);
        await route.fulfill({ status: 204, body: "" });
        return;
      }

      await fulfillError(
        route,
        404,
        "NOT_FOUND",
        `No Playwright mock for ${method} ${path}`,
      );
    },
  );
};
