import { describe, expect, it } from "vitest";
import { ApiError } from "./httpClient";
import {
  createEmptyResourceApi,
  createEntitlementAiRequiredResourceApi,
  createErrorResourceApi,
  createFreeAtLimitResourceApi,
  createMockResourceApi,
  mockEntitlement,
  mockItems,
  mockWardrobes,
  WEEKEND_WARDROBE_IMAGE_URL,
  WORKWEAR_WARDROBE_COVER_IMAGE_URL,
} from "./mockResourceApi";

describe("createMockResourceApi", () => {
  it("returns fixture wardrobes, items, outfits, and Virtual Profiles", async () => {
    const api = createMockResourceApi();

    await expect(api.getMe()).resolves.toEqual(mockEntitlement);
    await expect(api.deleteAccount()).resolves.toEqual({ deleted: true });
    await expect(api.createCheckoutSession("premium")).resolves.toEqual({
      url: "https://checkout.stripe.com/c/pay/mock-premium",
    });
    await expect(api.createPortalSession()).resolves.toEqual({
      url: "https://billing.stripe.com/p/session/mock",
    });
    await expect(api.listJobEvents()).resolves.toMatchObject({
      unreadCount: 1,
      events: [{ title: "Virtual Try On is ready" }],
    });
    await expect(api.listWardrobes()).resolves.toEqual({
      wardrobes: mockWardrobes,
    });
    await expect(api.getWardrobeDetail("wd_weekend01")).resolves.toMatchObject({
      wardrobe: { name: "Weekend closet" },
      items: mockItems.filter((item) => item.wardrobeId === "wd_weekend01"),
    });
    await expect(api.getItem("item_navytee01")).resolves.toMatchObject({
      name: "Navy tee",
    });
    await expect(api.listOutfits()).resolves.toMatchObject({
      outfits: [{ name: "Sunday brunch" }],
    });
    await expect(api.listAiProfiles()).resolves.toMatchObject({
      aiProfiles: [{ label: "Weekday look" }],
    });
    await expect(api.listGenericAiProfiles()).resolves.toMatchObject({
      aiProfiles: [{ label: "Catalog model" }],
    });
    expect(mockWardrobes[0]).toEqual(
      expect.objectContaining({
        imageUrl: WEEKEND_WARDROBE_IMAGE_URL,
      }),
    );
    expect(mockWardrobes[0]).not.toHaveProperty("coverImageUrl");
    expect(mockWardrobes[1]).toEqual(
      expect.objectContaining({
        coverImageUrl: WORKWEAR_WARDROBE_COVER_IMAGE_URL,
      }),
    );
    expect(mockWardrobes[1]).not.toHaveProperty("imageUrl");
  });

  it("clears catalog content and keeps the account", async () => {
    const api = createMockResourceApi();

    const wipe = await api.clearContent();
    expect(wipe.keepAccount).toBe(true);
    expect(wipe.deletedWardrobes).toBeGreaterThan(0);
    await expect(api.listWardrobes()).resolves.toEqual({ wardrobes: [] });
    await expect(api.listOutfits()).resolves.toEqual({ outfits: [] });
    await expect(api.listAiProfiles()).resolves.toEqual({ aiProfiles: [] });
    await expect(api.getMe()).resolves.toMatchObject({
      usage: { wardrobes: 0, items: 0, outfits: 0 },
    });
  });

  it("deletes a clothing item from the nested wardrobe route", async () => {
    const api = createMockResourceApi();

    await expect(
      api.deleteItem("wd_weekend01", "item_navytee01"),
    ).resolves.toBeUndefined();
    await expect(api.getItem("item_navytee01")).rejects.toMatchObject({
      status: 404,
      code: "ITEM_NOT_FOUND",
    });
  });

  it("limits wardrobe item lists when a limit is provided", async () => {
    const api = createMockResourceApi();

    await expect(
      api.listWardrobeItems("wd_weekend01", { limit: 1 }),
    ).resolves.toEqual({
      items: [mockItems[0]],
    });
    await expect(api.listWardrobeItems("wd_weekend01")).resolves.toEqual({
      items: mockItems.filter((entry) => entry.wardrobeId === "wd_weekend01"),
    });
  });

  it("deletes a wardrobe and strips its items from outfits in other wardrobes", async () => {
    const api = createMockResourceApi();
    const otherOutfit = await api.createOutfit("wd_work02", {
      name: "Desk look",
      items: [
        { itemId: "item_navytee01", slot: "TOP" },
        { itemId: "item_limit01", slot: "OUTERWEAR" },
      ],
    });
    expect(otherOutfit.items).toEqual([
      { itemId: "item_navytee01", slot: "TOP" },
      { itemId: "item_limit01", slot: "OUTERWEAR" },
    ]);

    await expect(api.deleteWardrobe("wd_weekend01")).resolves.toBeUndefined();
    await expect(api.getWardrobe("wd_weekend01")).rejects.toMatchObject({
      status: 404,
      code: "WARDROBE_NOT_FOUND",
    });
    await expect(api.getItem("item_navytee01")).rejects.toMatchObject({
      status: 404,
      code: "ITEM_NOT_FOUND",
    });
    await expect(api.listOutfits()).resolves.toEqual({
      outfits: [
        {
          ...otherOutfit,
          items: [{ itemId: "item_limit01", slot: "OUTERWEAR" }],
        },
      ],
    });
  });

  it("returns not-found errors for unknown detail ids", async () => {
    const api = createMockResourceApi();

    await expect(api.getWardrobe("missing")).rejects.toMatchObject({
      status: 404,
      code: "WARDROBE_NOT_FOUND",
    });
    await expect(api.getItem("missing")).rejects.toMatchObject({
      status: 404,
      code: "ITEM_NOT_FOUND",
    });
  });

  it("supports empty and error fixtures for page tests", async () => {
    await expect(createEmptyResourceApi().listWardrobes()).resolves.toEqual({
      wardrobes: [],
    });
    await expect(createErrorResourceApi().listOutfits()).rejects.toBeInstanceOf(
      ApiError,
    );
    await expect(
      createEntitlementAiRequiredResourceApi().listAiProfiles(),
    ).rejects.toMatchObject({
      status: 403,
      code: "ENTITLEMENT_AI_REQUIRED",
    });
  });

  it("creates catalog records and blocks Free-tier creates over the limit", async () => {
    const api = createMockResourceApi();
    const wardrobe = await api.createWardrobe({ name: "Travel" });
    expect(wardrobe.name).toBe("Travel");

    const upload = await api.createUpload({
      contentType: "image/jpeg",
      purpose: "WARDROBE_ITEM",
      contentLength: 8,
    });
    expect(upload.objectKey).toMatch(/^users\/user-1\/uploads\//);

    const item = await api.createItem(wardrobe.wardrobeId, {
      name: "Travel jacket",
      category: "OUTERWEAR",
      imageKey: upload.objectKey,
    });
    expect(item.wardrobeId).toBe(wardrobe.wardrobeId);

    const outfit = await api.createOutfit(wardrobe.wardrobeId, {
      name: "Airport",
      items: [{ itemId: item.itemId, slot: "OUTERWEAR" }],
    });
    expect(outfit.name).toBe("Airport");

    const limited = createFreeAtLimitResourceApi();
    await expect(limited.createWardrobe({ name: "Extra" })).rejects.toMatchObject({
      status: 403,
      code: "ENTITLEMENT_WARDROBE_LIMIT",
    });
    await expect(
      limited.createItem("wd_weekend01", {
        name: "Extra tee",
        category: "TOP",
        imageKey: "users/user-1/uploads/upl_mock.jpg",
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "ENTITLEMENT_ITEM_LIMIT",
    });
    await expect(
      limited.createOutfit("wd_weekend01", {
        name: "Extra look",
        items: [{ itemId: "item_limit01", slot: "TOP" }],
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "ENTITLEMENT_OUTFIT_LIMIT",
    });
  });

  it("exposes custom /me limits in getMe and blocked-create errors", async () => {
    const limits = { wardrobes: 3, items: 12, outfits: 20 };
    const limited = createFreeAtLimitResourceApi({}, { limits });

    await expect(limited.getMe()).resolves.toMatchObject({
      limits,
      usage: limits,
    });
    await expect(limited.createWardrobe({ name: "Extra" })).rejects.toMatchObject({
      status: 403,
      message: "Free plan allows 3 wardrobes. Upgrade to add more.",
    });
    await expect(
      limited.createItem("wd_weekend01", {
        name: "Extra tee",
        category: "TOP",
        imageKey: "users/user-1/uploads/upl_mock.jpg",
      }),
    ).rejects.toMatchObject({
      status: 403,
      message: "Free plan allows 12 clothing items. Upgrade to add more.",
    });
    await expect(
      limited.createOutfit("wd_weekend01", {
        name: "Extra look",
        items: [{ itemId: "item_limit01", slot: "TOP" }],
      }),
    ).rejects.toMatchObject({
      status: 403,
      message: "Free plan allows 20 outfits. Upgrade to add more.",
    });
  });
});
