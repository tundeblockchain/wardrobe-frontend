/**
 * Playwright network fixtures for the WARDROBE-244 wishlist contract
 * (wardrobe-backend#91). Intercepts the same routes the web client uses:
 * GET/POST /wishlist, GET/PATCH/DELETE /wishlist/{id},
 * POST /wishlist/{id}/acquire, POST /wishlist/uploads, plus GET /me
 * and GET /wardrobes. Empty optional fields are omitted, never null.
 */
import type { Page, Request, Route } from "@playwright/test";
import { E2E_API_ORIGIN, E2E_USER_ID } from "./env";

export const ITEM_CAP_CODE = "ENTITLEMENT_ITEM_LIMIT";
export const WISHLIST_LIMIT_CODE = "WISHLIST_LIMIT";
export const WISHLIST_LIMIT_MESSAGE = "Wish list can hold 500 items.";

export type E2EWishPrice = {
  amount: number;
  currency: string;
};

export type E2EWish = {
  wishId: string;
  name: string;
  category?: string;
  subcategory?: string;
  image?: { originalKey: string };
  originalImageUrl?: string;
  link?: string;
  price?: E2EWishPrice;
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
  /** Keep GET /wishlist pending so the loading state stays on screen. */
  holdWishlistList?: boolean;
  acquireItemCap?: boolean;
  rejectCreateAtLimit?: boolean;
  pagedWishlist?: boolean;
};

const nowIso = "2026-10-13T12:00:00.000Z";

export const httpsWish: E2EWish = {
  wishId: "wish_loafers01",
  name: "Black loafers",
  category: "SHOES",
  subcategory: "LOAFER",
  image: { originalKey: "users/e2e/wishlist/uploads/loafers.jpg" },
  originalImageUrl: "/screenshots/item-detail-390.jpg",
  link: "https://example.com/black-loafers",
  price: { amount: 145, currency: "GBP" },
  notes: "For work days.",
  createdAt: "2026-10-12T09:00:00.000Z",
  updatedAt: "2026-10-12T09:00:00.000Z",
};

export const incompleteWish: E2EWish = {
  wishId: "wish_linen01",
  name: "Linen shirt",
  notes: "Needs a category and a photo.",
  createdAt: "2026-10-09T12:00:00.000Z",
  updatedAt: "2026-10-09T12:00:00.000Z",
};

export const photoOnlyMissingWish: E2EWish = {
  wishId: "wish_scarf01",
  name: "Forest scarf",
  category: "ACCESSORY",
  createdAt: "2026-10-10T18:30:00.000Z",
  updatedAt: "2026-10-10T18:30:00.000Z",
};

export const unsafeLinkWish: E2EWish = {
  wishId: "wish_script01",
  name: "Unsafe link coat",
  category: "OUTERWEAR",
  link: "javascript:alert(1)",
  createdAt: "2026-10-11T09:00:00.000Z",
  updatedAt: "2026-10-11T09:00:00.000Z",
};

export const httpLinkWish: E2EWish = {
  wishId: "wish_http01",
  name: "Http link bag",
  category: "BAG",
  link: "http://example.com/bag",
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

export const freeEntitlement = {
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
  return {
    ...wish,
    image: wish.image ? { ...wish.image } : undefined,
    price: wish.price ? { ...wish.price } : undefined,
  };
};

const omitEmpty = (wish: E2EWish): E2EWish => {
  const cloned = cloneWish(wish);
  if (!cloned.category) {
    delete cloned.category;
  }
  if (!cloned.subcategory) {
    delete cloned.subcategory;
  }
  if (!cloned.image) {
    delete cloned.image;
  }
  if (!cloned.originalImageUrl) {
    delete cloned.originalImageUrl;
  }
  if (!cloned.link) {
    delete cloned.link;
  }
  if (!cloned.price) {
    delete cloned.price;
  }
  if (!cloned.notes) {
    delete cloned.notes;
  }
  return cloned;
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

const isCleared = (value: unknown): boolean => {
  return value === null || value === "";
};

const hasWishImage = (wish: E2EWish): boolean => {
  return Boolean(wish.image?.originalKey || wish.originalImageUrl);
};

const applyWishBody = (wish: E2EWish, body: Record<string, unknown>): void => {
  const name = readString(body, "name");
  if (name !== undefined) {
    wish.name = name.trim();
  }
  if (body.category !== undefined) {
    if (isCleared(body.category)) {
      delete wish.category;
    } else if (typeof body.category === "string") {
      wish.category = body.category;
    }
  }
  if (body.subcategory !== undefined) {
    if (isCleared(body.subcategory)) {
      delete wish.subcategory;
    } else if (typeof body.subcategory === "string") {
      wish.subcategory = body.subcategory;
    }
  }
  if (body.link !== undefined) {
    if (isCleared(body.link)) {
      delete wish.link;
    } else if (typeof body.link === "string") {
      wish.link = body.link;
    }
  }
  if (body.notes !== undefined) {
    if (isCleared(body.notes)) {
      delete wish.notes;
    } else if (typeof body.notes === "string") {
      wish.notes = body.notes;
    }
  }
  if (body.price !== undefined) {
    if (body.price === null) {
      delete wish.price;
    } else if (
      body.price &&
      typeof body.price === "object" &&
      typeof (body.price as { amount?: unknown }).amount === "number" &&
      typeof (body.price as { currency?: unknown }).currency === "string"
    ) {
      const price = body.price as { amount: number; currency: string };
      wish.price = { amount: price.amount, currency: price.currency };
    }
  }
  const imageKey = readString(body, "imageKey");
  if (imageKey) {
    wish.image = { originalKey: imageKey };
    wish.originalImageUrl = "/screenshots/item-detail-390.jpg";
  } else if (body.imageKey !== undefined && isCleared(body.imageKey)) {
    delete wish.image;
    delete wish.originalImageUrl;
  }
  wish.updatedAt = nowIso;
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
        await fulfillJson(route, 200, freeEntitlement);
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
        if (options.holdWishlistList) {
          await new Promise<void>(() => undefined);
          return;
        }

        if (options.pagedWishlist) {
          const cursor = url.searchParams.get("cursor");
          if (!cursor) {
            await fulfillJson(route, 200, {
              wishes: wishes.slice(0, 1).map(omitEmpty),
              nextCursor: "page-2",
            });
            return;
          }

          await fulfillJson(route, 200, {
            wishes: wishes.slice(1).map(omitEmpty),
          });
          return;
        }

        await fulfillJson(route, 200, {
          wishes: wishes.map(omitEmpty),
        });
        return;
      }

      if (method === "POST" && path === "/wishlist/uploads") {
        const body = readJsonBody(request);
        const contentType = readString(body, "contentType") ?? "";
        const allowed = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/heic",
        ];
        if (!allowed.includes(contentType) || body.purpose !== "WISHLIST") {
          await fulfillError(
            route,
            400,
            "UPLOAD_INVALID",
            "That photo could not be uploaded.",
          );
          return;
        }

        await fulfillJson(route, 201, {
          uploadUrl: "https://uploads.pocketcloset.test/wishlist",
          objectKey: `users/${E2E_USER_ID}/wishlist/uploads/upl_wish.jpg`,
          expiresIn: 900,
        });
        return;
      }

      if (method === "POST" && acquireMatch) {
        const wishId = decodeURIComponent(acquireMatch[1] ?? "");
        const index = wishes.findIndex((wish) => wish.wishId === wishId);
        if (index < 0) {
          await fulfillError(route, 404, "WISH_NOT_FOUND", "Wish not found.");
          return;
        }

        const wish = wishes[index]!;
        if (!wish.category || !hasWishImage(wish)) {
          await fulfillError(
            route,
            400,
            "VALIDATION_ERROR",
            "Wish needs a category and a photo before it can move into a wardrobe.",
          );
          return;
        }

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
        if (!wardrobeId || !wardrobes.some((row) => row.wardrobeId === wardrobeId)) {
          await fulfillError(
            route,
            404,
            "WARDROBE_NOT_FOUND",
            "Wardrobe not found.",
          );
          return;
        }

        wishes.splice(index, 1);
        await fulfillJson(route, 201, {
          itemId: `item_from_${wishId}`,
          wardrobeId,
          name: wish.name,
          category: wish.category,
          subcategory: wish.subcategory,
          image: wish.image,
          originalImageUrl: wish.originalImageUrl,
          processingStatus: "READY",
          createdAt: nowIso,
          updatedAt: nowIso,
        });
        return;
      }

      if (method === "POST" && path === "/wishlist") {
        if (options.rejectCreateAtLimit) {
          await fulfillError(
            route,
            409,
            WISHLIST_LIMIT_CODE,
            WISHLIST_LIMIT_MESSAGE,
          );
          return;
        }

        const body = readJsonBody(request);
        const name = readString(body, "name")?.trim() ?? "";
        const wish: E2EWish = {
          wishId: `wish_new_${nextWishNumber}`,
          name,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        nextWishNumber += 1;
        applyWishBody(wish, body);
        wishes.unshift(wish);
        await fulfillJson(route, 201, omitEmpty(wish));
        return;
      }

      if (method === "GET" && wishMatch && !acquireMatch) {
        const wishId = decodeURIComponent(wishMatch[1] ?? "");
        const wish = wishes.find((entry) => entry.wishId === wishId);
        if (!wish) {
          await fulfillError(route, 404, "WISH_NOT_FOUND", "Wish not found.");
          return;
        }

        await fulfillJson(route, 200, omitEmpty(wish));
        return;
      }

      if (method === "PATCH" && wishMatch) {
        const wishId = decodeURIComponent(wishMatch[1] ?? "");
        const wish = wishes.find((entry) => entry.wishId === wishId);
        if (!wish) {
          await fulfillError(route, 404, "WISH_NOT_FOUND", "Wish not found.");
          return;
        }

        applyWishBody(wish, readJsonBody(request));
        await fulfillJson(route, 200, omitEmpty(wish));
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
