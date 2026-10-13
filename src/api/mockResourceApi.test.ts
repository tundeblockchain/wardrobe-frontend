import { describe, expect, it } from "vitest";
import { ApiError } from "./httpClient";
import {
  createEmptyResourceApi,
  createErrorResourceApi,
  createMockResourceApi,
  mockItems,
  mockWardrobes,
} from "./mockResourceApi";

describe("createMockResourceApi", () => {
  it("returns fixture wardrobes, items, outfits, and Virtual Profiles", async () => {
    const api = createMockResourceApi();

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
  });
});
