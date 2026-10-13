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
} from "./mockResourceApi";

describe("createMockResourceApi", () => {
  it("returns fixture wardrobes, items, outfits, and Virtual Profiles", async () => {
    const api = createMockResourceApi();

    await expect(api.getMe()).resolves.toEqual(mockEntitlement);
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
      aiProfiles: [{ label: "Weekday look" }, { label: "Catalog model" }],
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
});
