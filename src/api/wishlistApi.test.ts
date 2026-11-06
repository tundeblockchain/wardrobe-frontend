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
  getSafeWishLinkUrl,
  getWishAcquireApiPath,
  getWishApiPath,
  getWishlistApiPath,
  isAllowedWishLink,
  isHttpsUrl,
  isWishlistLimitError,
  loadAllWishes,
  mockWishes,
  toWishList,
  validateWishForm,
  WISHLIST_COLLECTION_PATH,
  WISHLIST_LIMIT_CODE,
  WISHLIST_MAX_ITEMS,
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

describe("wishlist URL helpers", () => {
  it("builds collection, item, and acquire paths", () => {
    expect(getWishlistApiPath()).toBe(WISHLIST_COLLECTION_PATH);
    expect(getWishlistApiPath({ cursor: "50", limit: 50, category: "TOP" })).toBe(
      "/wishlist?cursor=50&limit=50&category=TOP",
    );
    expect(getWishApiPath("wish 1")).toBe("/wishlist/wish%201");
    expect(getWishAcquireApiPath("wish_1")).toBe("/wishlist/wish_1/acquire");
  });

  it("normalizes list payloads from wishes or items arrays", () => {
    expect(toWishList([{ wishId: "wish_1" }])).toEqual({
      wishes: [{ wishId: "wish_1" }],
    });
    expect(
      toWishList({ items: [{ wishId: "wish_2" }], nextCursor: "10" }),
    ).toEqual({
      wishes: [{ wishId: "wish_2" }],
      nextCursor: "10",
    });
    expect(toWishList(null)).toEqual({ wishes: [] });
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
    expect(validateWishForm({
      name: "",
      category: "",
      subcategory: "",
      linkUrl: "http://example.com",
      price: "-1",
      currency: "GB",
      notes: "",
    })).toEqual({
      name: "Name is required.",
      linkUrl: "Enter an https:// link.",
      price: "Enter a price of 0 or more.",
      currency: "Currency must be a 3-letter code.",
    });
  });

  it("accepts a named wish with an https link", () => {
    expect(
      validateWishForm({
        name: "Tan trench",
        category: "OUTERWEAR",
        subcategory: "COAT",
        linkUrl: "https://example.com/trench",
        price: "189",
        currency: "GBP",
        notes: "Winter",
      }),
    ).toEqual({});
  });
});

describe("formatWishPrice", () => {
  it("formats a price with currency and skips conversion", () => {
    expect(formatWishPrice(189, "GBP")).toBe("£189.00");
    expect(formatWishPrice(40, "USD")).toMatch(/40/);
    expect(formatWishPrice(undefined, "GBP")).toBeUndefined();
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

  it("filters by category and paginates", async () => {
    const api = createMockWishlistApi();
    await expect(api.listWishes({ category: "SHOES" })).resolves.toMatchObject({
      wishes: [{ name: "Black loafers" }],
    });

    const firstPage = await api.listWishes({ limit: 1 });
    expect(firstPage.wishes).toHaveLength(1);
    expect(firstPage.nextCursor).toBe("1");
    const secondPage = await api.listWishes({
      limit: 1,
      cursor: firstPage.nextCursor,
    });
    expect(secondPage.wishes[0]?.name).toBe("Tan trench");
  });

  it("creates, updates, and deletes a wish without touching wardrobe items", async () => {
    const wishlistApi = createEmptyWishlistApi();
    const resourceApi = createMockResourceApi();
    const before = await resourceApi.getMe();
    const itemsBefore = await resourceApi.listWardrobeItems("wd_weekend01");

    const created = await wishlistApi.createWish({
      name: "Wanted coat",
      category: "OUTERWEAR",
      linkUrl: "https://example.com/coat",
      price: 120,
      currency: "GBP",
    });
    expect(created.name).toBe("Wanted coat");

    const updated = await wishlistApi.updateWish(created.wishId, {
      notes: "Navy if possible.",
    });
    expect(updated.notes).toBe("Navy if possible.");

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

  it("rejects create at the 500-wish cap without a paywall code", async () => {
    const seeded: WishItem[] = Array.from({ length: WISHLIST_MAX_ITEMS }, (_, index) => ({
      wishId: `wish_cap_${index + 1}`,
      name: `Wish ${index + 1}`,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    }));
    const api = createMockWishlistApi({}, { wishes: seeded });

    await expect(api.createWish({ name: "One more" })).rejects.toMatchObject({
      code: WISHLIST_LIMIT_CODE,
      status: 400,
      message: "Wish list can hold 500 pieces. Remove one to add another.",
    });
    expect(isWishlistLimitError(wishlistLimitError())).toBe(true);
  });

  it("acquires a wish into a wardrobe and removes it from the list", async () => {
    const api = createMockWishlistApi();
    const acquired = await api.acquireWish("wish_loafers01", {
      wardrobeId: "wd_weekend01",
    });
    expect(acquired.wardrobeId).toBe("wd_weekend01");
    expect(acquired.item.name).toBe("Black loafers");
    const remaining = await api.listWishes();
    expect(remaining.wishes.map((wish) => wish.wishId)).not.toContain(
      "wish_loafers01",
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
  it("walks cursors until the list is complete", async () => {
    const listWishes = vi
      .fn()
      .mockResolvedValueOnce({
        wishes: [{ wishId: "wish_1", name: "One" }],
        nextCursor: "1",
      })
      .mockResolvedValueOnce({
        wishes: [{ wishId: "wish_2", name: "Two" }],
      });

    await expect(loadAllWishes({ listWishes })).resolves.toEqual([
      { wishId: "wish_1", name: "One" },
      { wishId: "wish_2", name: "Two" },
    ]);
    expect(listWishes).toHaveBeenCalledTimes(2);
  });
});

describe("createLiveWishlistApi", () => {
  it("calls the agreed wishlist routes", async () => {
    const request = vi.fn(async (path: string, options?: { method?: string; body?: unknown }) => {
      if (path === "/wishlist" || path.startsWith("/wishlist?")) {
        if (options?.method === "POST") {
          return { wishId: "wish_new", name: "Coat" };
        }
        return { wishes: mockWishes, nextCursor: undefined };
      }
      if (path === "/wishlist/wish_loafers01" && options?.method === "PATCH") {
        return { wishId: "wish_loafers01", name: "Updated" };
      }
      if (path === "/wishlist/wish_loafers01" && options?.method === "DELETE") {
        return undefined;
      }
      if (path === "/wishlist/wish_loafers01/acquire") {
        return {
          wishId: "wish_loafers01",
          wardrobeId: "wd_weekend01",
          item: { itemId: "item_new", wardrobeId: "wd_weekend01" },
        };
      }
      if (path === "/uploads") {
        return {
          uploadUrl: "https://uploads.example.com/presigned/wish.jpg",
          objectKey: "users/user-1/uploads/upl_wish.jpg",
          expiresIn: 900,
        };
      }
      throw new Error(`unexpected path ${path}`);
    });
    const api = createLiveWishlistApi(createApi(request as AuthenticatedApi["request"]));

    await expect(api.listWishes({ limit: 50 })).resolves.toMatchObject({
      wishes: mockWishes,
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
    ).resolves.toMatchObject({ wardrobeId: "wd_weekend01" });
    await expect(
      api.createUpload({
        contentType: "image/jpeg",
        purpose: "WARDROBE_ITEM",
      }),
    ).resolves.toMatchObject({
      objectKey: "users/user-1/uploads/upl_wish.jpg",
    });

    expect(request).toHaveBeenCalledWith("/wishlist?limit=50");
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
