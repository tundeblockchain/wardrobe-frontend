import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedApi } from "./authenticatedApi";
import { catalogLimitError } from "./catalogLimits";
import { ApiError } from "./httpClient";
import {
  createMockResourceApi,
  createFreeAtLimitResourceApi,
} from "./mockResourceApi";
import {
  createEmptyWishlistApi,
  createErrorWishlistApi,
  createLiveWishlistApi,
  createMockWishlistApi,
  createWishlistApi,
  formatWishPrice,
  getMissingAcquireDetails,
  getSafeWishLinkUrl,
  getWishAcquireApiPath,
  getWishApiPath,
  getWishlistApiPath,
  isAllowedWishLink,
  isHttpsUrl,
  isWishReadyToAcquire,
  isWishlistLimitError,
  loadAllWishes,
  mockIncompleteWish,
  mockWishes,
  toCreateWishRequest,
  toWishList,
  UPLOAD_PURPOSE_WISHLIST,
  validateWishForm,
  WISH_LINK_MAX_LENGTH,
  WISH_NOTES_MAX_LENGTH,
  WISHLIST_COLLECTION_PATH,
  WISHLIST_LIMIT_CODE,
  WISHLIST_LIMIT_MESSAGE,
  WISHLIST_MAX_ITEMS,
  WISHLIST_PAGE_SIZE,
  WISHLIST_UPLOADS_PATH,
  wishlistLimitError,
  type WishItem,
} from "./wishlistApi";

const createApi = (
  request: AuthenticatedApi["request"],
): AuthenticatedApi => {
  return {
    request,
    getMe: vi.fn(),
    deleteAccount: vi.fn(),
    clearContent: vi.fn(),
  };
};

const completeWish = (overrides: Partial<WishItem> = {}): WishItem => {
  return {
    wishId: "wish_1",
    name: "Coat",
    createdAt: "2026-10-13T12:00:00.000Z",
    updatedAt: "2026-10-13T12:00:00.000Z",
    ...overrides,
  };
};

describe("wishlist URL helpers", () => {
  it("builds collection, item, acquire, and upload paths", () => {
    expect(getWishlistApiPath()).toBe(WISHLIST_COLLECTION_PATH);
    expect(
      getWishlistApiPath({ cursor: "abc", limit: 20, category: "TOP" }),
    ).toBe("/wishlist?limit=20&cursor=abc&category=TOP");
    expect(getWishApiPath("wish 1")).toBe("/wishlist/wish%201");
    expect(getWishAcquireApiPath("wish_1")).toBe("/wishlist/wish_1/acquire");
    expect(WISHLIST_UPLOADS_PATH).toBe("/wishlist/uploads");
    expect(WISHLIST_PAGE_SIZE).toBe(20);
  });

  it("reads the wishes key only and drops an items fallback", () => {
    expect(
      toWishList({
        wishes: [completeWish({ wishId: "wish_1", name: "One" })],
        nextCursor: "abc",
      }),
    ).toEqual({
      wishes: [completeWish({ wishId: "wish_1", name: "One" })],
      nextCursor: "abc",
    });
    expect(() => toWishList({ items: [completeWish()] })).toThrow(
      "Wish list response is missing wishes.",
    );
    expect(() => toWishList([completeWish()])).toThrow(
      "Wish list response is missing wishes.",
    );
  });
});

describe("wish link validation", () => {
  it("allows empty links and https URLs only", () => {
    expect(isAllowedWishLink("")).toBe(true);
    expect(isAllowedWishLink("   ")).toBe(true);
    expect(isHttpsUrl("https://example.com/coat")).toBe(true);
    expect(isAllowedWishLink("https://example.com/coat")).toBe(true);
    expect(isAllowedWishLink("http://example.com/coat")).toBe(false);
    expect(isAllowedWishLink("javascript:alert(1)")).toBe(false);
    expect(isAllowedWishLink("example.com")).toBe(false);
    expect(getSafeWishLinkUrl("http://example.com")).toBeUndefined();
    expect(getSafeWishLinkUrl("https://example.com/coat")).toBe(
      "https://example.com/coat",
    );
  });
});

describe("wish form validation", () => {
  it("requires a name and rejects non-https links", () => {
    expect(
      validateWishForm({
        name: "",
        category: "",
        subcategory: "",
        link: "http://example.com",
        price: "-1",
        currency: "GB",
        notes: "",
      }),
    ).toEqual({
      name: "Name is required.",
      link: "Enter an https:// link.",
      price: "Enter a price of 0 or more.",
      currency: "Currency must be a 3-letter code.",
    });
  });

  it("enforces name, notes, and link length limits", () => {
    expect(
      validateWishForm({
        name: "n".repeat(101),
        category: "",
        subcategory: "",
        link: `https://example.com/${"a".repeat(WISH_LINK_MAX_LENGTH)}`,
        price: "",
        currency: "",
        notes: "n".repeat(WISH_NOTES_MAX_LENGTH + 1),
      }),
    ).toMatchObject({
      name: "Name must be 100 characters or fewer.",
      link: `Link must be ${WISH_LINK_MAX_LENGTH} characters or fewer.`,
      notes: `Notes must be ${WISH_NOTES_MAX_LENGTH} characters or fewer.`,
    });
  });

  it("accepts a named wish with an https link and nested price", () => {
    expect(
      validateWishForm({
        name: "Tan trench",
        category: "OUTERWEAR",
        subcategory: "COAT",
        link: "https://example.com/trench",
        price: "189",
        currency: "GBP",
        notes: "Winter",
      }),
    ).toEqual({});
    expect(
      toCreateWishRequest({
        name: "Tan trench",
        category: "OUTERWEAR",
        subcategory: "",
        link: "https://example.com/trench",
        price: "189",
        currency: "GBP",
        notes: "",
      }),
    ).toEqual({
      name: "Tan trench",
      category: "OUTERWEAR",
      link: "https://example.com/trench",
      price: { amount: 189, currency: "GBP" },
    });
  });
});

describe("formatWishPrice", () => {
  it("formats a nested price object and skips conversion", () => {
    expect(formatWishPrice({ amount: 189, currency: "GBP" })).toBe("£189.00");
    expect(formatWishPrice({ amount: 40, currency: "USD" })).toMatch(/40/);
    expect(formatWishPrice(undefined)).toBeUndefined();
  });
});

describe("acquire readiness", () => {
  it("requires a category and an image before acquire", () => {
    expect(isWishReadyToAcquire(mockWishes[0]!)).toBe(true);
    expect(getMissingAcquireDetails(mockWishes[2]!)).toEqual({
      category: false,
      image: true,
    });
    expect(getMissingAcquireDetails(mockIncompleteWish)).toEqual({
      category: true,
      image: true,
    });
    expect(isWishReadyToAcquire(mockIncompleteWish)).toBe(false);
  });
});

describe("createMockWishlistApi", () => {
  it("lists fixture wishes newest first", async () => {
    const api = createMockWishlistApi();
    const result = await api.listWishes();
    expect(result.wishes.map((wish) => wish.wishId)).toEqual(
      mockWishes.map((wish) => wish.wishId),
    );
    expect(result.wishes[0]?.name).toBe("Black loafers");
  });

  it("filters by category and paginates with nextCursor", async () => {
    const api = createMockWishlistApi();
    await expect(api.listWishes({ category: "SHOES" })).resolves.toMatchObject({
      wishes: [{ name: "Black loafers" }],
    });

    const firstPage = await api.listWishes({ limit: 1 });
    expect(firstPage.wishes).toHaveLength(1);
    expect(firstPage.wishes[0]?.name).toBe("Black loafers");
    expect(firstPage.nextCursor).toBe("wish_loafers01");
    const secondPage = await api.listWishes({
      limit: 1,
      cursor: firstPage.nextCursor,
    });
    expect(secondPage.wishes[0]?.name).toBe("Tan trench");
    expect(secondPage.nextCursor).toBe("wish_trench01");
  });

  it("creates, updates, and deletes a wish without touching wardrobe items", async () => {
    const wishlistApi = createEmptyWishlistApi();
    const resourceApi = createMockResourceApi();
    const before = await resourceApi.getMe();
    const itemsBefore = await resourceApi.listWardrobeItems("wd_weekend01");

    const created = await wishlistApi.createWish({
      name: "Wanted coat",
      category: "OUTERWEAR",
      link: "https://example.com/coat",
      price: { amount: 120, currency: "GBP" },
    });
    expect(created.name).toBe("Wanted coat");
    expect(created.link).toBe("https://example.com/coat");
    expect(created.price).toEqual({ amount: 120, currency: "GBP" });

    const updated = await wishlistApi.updateWish(created.wishId, {
      notes: "Navy if possible.",
    });
    expect(updated.notes).toBe("Navy if possible.");

    const cleared = await wishlistApi.updateWish(created.wishId, {
      link: null,
      price: null,
    });
    expect(cleared.link).toBeUndefined();
    expect(cleared.price).toBeUndefined();

    const listed = await wishlistApi.listWishes();
    expect(listed.wishes).toHaveLength(1);

    await wishlistApi.deleteWish(created.wishId);
    await expect(wishlistApi.listWishes()).resolves.toEqual({ wishes: [] });

    const after = await resourceApi.getMe();
    const itemsAfter = await resourceApi.listWardrobeItems("wd_weekend01");
    expect(after.usage.items).toBe(before.usage.items);
    expect(itemsAfter.items.map((item) => item.itemId)).toEqual(
      itemsBefore.items.map((item) => item.itemId),
    );
  });

  it("rejects create at the 500-wish cap with WISHLIST_LIMIT 409", async () => {
    const seeded: WishItem[] = Array.from(
      { length: WISHLIST_MAX_ITEMS },
      (_, index) => ({
        wishId: `wish_cap_${index + 1}`,
        name: `Wish ${index + 1}`,
        createdAt: "2026-10-01T00:00:00.000Z",
        updatedAt: "2026-10-01T00:00:00.000Z",
      }),
    );
    const api = createMockWishlistApi({}, { wishes: seeded });

    await expect(api.createWish({ name: "One more" })).rejects.toMatchObject({
      code: WISHLIST_LIMIT_CODE,
      status: 409,
      message: WISHLIST_LIMIT_MESSAGE,
    });
    expect(isWishlistLimitError(wishlistLimitError())).toBe(true);
  });

  it("acquires a ready wish as a ClothingItem and removes it from the list", async () => {
    const api = createMockWishlistApi();
    const acquired = await api.acquireWish("wish_loafers01", {
      wardrobeId: "wd_weekend01",
    });
    expect(acquired.itemId).toBe("item_wish_loafers01");
    expect(acquired.wardrobeId).toBe("wd_weekend01");
    expect(acquired.name).toBe("Black loafers");
    expect(acquired.category).toBe("SHOES");
    const remaining = await api.listWishes();
    expect(remaining.wishes.map((wish) => wish.wishId)).not.toContain(
      "wish_loafers01",
    );
  });

  it("rejects acquire when the wish is missing a category or photo", async () => {
    const api = createMockWishlistApi({}, { wishes: [mockIncompleteWish] });
    await expect(
      api.acquireWish(mockIncompleteWish.wishId, {
        wardrobeId: "wd_weekend01",
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
    });
    const listed = await api.listWishes();
    expect(listed.wishes.map((wish) => wish.wishId)).toContain(
      mockIncompleteWish.wishId,
    );
  });

  it("does not count wishes toward Free-tier clothing item usage", async () => {
    const resourceApi = createFreeAtLimitResourceApi();
    const wishlistApi = createEmptyWishlistApi();
    const before = await resourceApi.getMe();

    await wishlistApi.createWish({ name: "Extra coat", category: "OUTERWEAR" });
    const after = await resourceApi.getMe();
    const items = await resourceApi.listWardrobeItems(
      before.usage.wardrobes > 0 ? "wd_weekend01" : "wd_limit01",
    );

    expect(after.usage.items).toBe(before.usage.items);
    expect(items.items.some((item) => item.name === "Extra coat")).toBe(false);
  });
});

describe("loadAllWishes", () => {
  it("walks nextCursor until the list is complete", async () => {
    const listWishes = vi
      .fn()
      .mockResolvedValueOnce({
        wishes: [completeWish({ wishId: "wish_1", name: "One" })],
        nextCursor: "wish_1",
      })
      .mockResolvedValueOnce({
        wishes: [completeWish({ wishId: "wish_2", name: "Two" })],
      });

    await expect(loadAllWishes({ listWishes })).resolves.toEqual([
      completeWish({ wishId: "wish_1", name: "One" }),
      completeWish({ wishId: "wish_2", name: "Two" }),
    ]);
    expect(listWishes).toHaveBeenCalledTimes(2);
    expect(listWishes).toHaveBeenNthCalledWith(1, {
      limit: WISHLIST_PAGE_SIZE,
      cursor: undefined,
    });
    expect(listWishes).toHaveBeenNthCalledWith(2, {
      limit: WISHLIST_PAGE_SIZE,
      cursor: "wish_1",
    });
  });
});

describe("createLiveWishlistApi", () => {
  it("calls the WARDROBE-244 wishlist routes", async () => {
    const created = completeWish({ wishId: "wish_new", name: "Coat" });
    const updated = completeWish({
      wishId: "wish_loafers01",
      name: "Updated",
    });
    const acquiredItem = {
      itemId: "item_new",
      wardrobeId: "wd_weekend01",
      name: "Black loafers",
      category: "SHOES",
      processingStatus: "READY",
      createdAt: "2026-10-13T12:00:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
    };
    const request = vi.fn(
      async (path: string, options?: { method?: string; body?: unknown }) => {
        if (path === "/wishlist" || path.startsWith("/wishlist?")) {
          if (options?.method === "POST") {
            return created;
          }
          return { wishes: mockWishes, nextCursor: undefined };
        }
        if (path === "/wishlist/wish_loafers01" && options?.method === "PATCH") {
          return updated;
        }
        if (path === "/wishlist/wish_loafers01" && !options?.method) {
          return mockWishes[0];
        }
        if (path === "/wishlist/wish_loafers01" && options?.method === "DELETE") {
          return undefined;
        }
        if (path === "/wishlist/wish_loafers01/acquire") {
          return acquiredItem;
        }
        if (path === "/wishlist/uploads") {
          return {
            uploadUrl: "https://uploads.example.com/presigned/wish.jpg",
            objectKey: "users/user-1/wishlist/uploads/upl_wish.jpg",
            expiresIn: 900,
          };
        }
        throw new Error(`unexpected path ${path}`);
      },
    );
    const api = createLiveWishlistApi(
      createApi(request as AuthenticatedApi["request"]),
    );

    await expect(api.listWishes()).resolves.toMatchObject({
      wishes: mockWishes,
    });
    await expect(api.getWish("wish_loafers01")).resolves.toMatchObject({
      wishId: "wish_loafers01",
    });
    await expect(api.createWish({ name: "Coat" })).resolves.toMatchObject({
      wishId: "wish_new",
    });
    await expect(
      api.updateWish("wish_loafers01", { name: "Updated" }),
    ).resolves.toMatchObject({ name: "Updated" });
    await expect(api.deleteWish("wish_loafers01")).resolves.toBeUndefined();
    await expect(
      api.acquireWish("wish_loafers01", { wardrobeId: "wd_weekend01" }),
    ).resolves.toMatchObject({ itemId: "item_new", wardrobeId: "wd_weekend01" });
    await expect(
      api.createUpload({
        contentType: "image/jpeg",
        purpose: UPLOAD_PURPOSE_WISHLIST,
      }),
    ).resolves.toMatchObject({
      objectKey: "users/user-1/wishlist/uploads/upl_wish.jpg",
    });

    expect(request).toHaveBeenCalledWith("/wishlist?limit=20");
    expect(request).toHaveBeenCalledWith("/wishlist", {
      method: "POST",
      body: { name: "Coat" },
    });
    expect(request).toHaveBeenCalledWith("/wishlist/wish_loafers01", {
      method: "PATCH",
      body: { name: "Updated" },
    });
    expect(request).toHaveBeenCalledWith("/wishlist/wish_loafers01", {
      method: "DELETE",
    });
    expect(request).toHaveBeenCalledWith("/wishlist/wish_loafers01/acquire", {
      method: "POST",
      body: { wardrobeId: "wd_weekend01" },
    });
    expect(request).toHaveBeenCalledWith("/wishlist/uploads", {
      method: "POST",
      body: {
        contentType: "image/jpeg",
        contentLength: undefined,
        purpose: UPLOAD_PURPOSE_WISHLIST,
      },
    });
  });

  it("uses the mock client when mock mode is on", () => {
    const api = createWishlistApi(createApi(vi.fn()), true);
    expect(api.listWishes).toEqual(expect.any(Function));
  });
});

describe("createErrorWishlistApi", () => {
  it("rejects every method", async () => {
    const api = createErrorWishlistApi();
    await expect(api.listWishes()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("wish items stay out of wardrobe catalog data", () => {
  it("does not add wishes to outfits or suggested outfits", async () => {
    const resourceApi = createMockResourceApi();
    const wishlistApi = createMockWishlistApi();
    await wishlistApi.createWish({ name: "Not owned yet", category: "DRESS" });

    const outfits = await resourceApi.listOutfits();
    const recommendations = await resourceApi.listRecommendations("wd_weekend01");
    const items = await resourceApi.listWardrobeItems("wd_weekend01");

    expect(outfits.outfits.some((outfit) => outfit.name === "Not owned yet")).toBe(
      false,
    );
    expect(
      recommendations.recommendations.some((row) =>
        row.items.some((item) => item.name === "Not owned yet"),
      ),
    ).toBe(false);
    expect(items.items.some((item) => item.name === "Not owned yet")).toBe(false);
  });

  it("keeps a wish when acquire is rejected with the item-cap error", async () => {
    const acquireWish = vi.fn().mockRejectedValue(catalogLimitError("item"));
    const api = createMockWishlistApi({ acquireWish });

    await expect(
      api.acquireWish("wish_loafers01", { wardrobeId: "wd_weekend01" }),
    ).rejects.toMatchObject({ code: "ENTITLEMENT_ITEM_LIMIT" });
    const listed = await api.listWishes();
    expect(listed.wishes.map((wish) => wish.wishId)).toContain("wish_loafers01");
  });
});
