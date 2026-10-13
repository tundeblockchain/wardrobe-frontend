import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedApi } from "./authenticatedApi";
import { ApiError } from "./httpClient";
import {
  aiProfileModelsPath,
  aiProfilesPath,
  createLiveResourceApi,
  createResourceApi,
  getWardrobeApiPath,
  getWardrobeItemApiPath,
  getWardrobeItemsApiPath,
  getWardrobeOutfitsApiPath,
  isNotFoundError,
  wardrobeCollectionPath,
} from "./resourceApi";
import type { AiProfile, ClothingItem, Outfit, Wardrobe } from "./resourceTypes";

const wardrobe: Wardrobe = {
  wardrobeId: "wd_1",
  name: "Weekend closet",
  createdAt: "2026-09-03T18:35:00.000Z",
  updatedAt: "2026-09-03T18:35:00.000Z",
};

const item: ClothingItem = {
  itemId: "item_1",
  wardrobeId: "wd_1",
  name: "Navy tee",
  category: "TOP",
  processingStatus: "READY",
  createdAt: "2026-09-03T18:40:00.000Z",
  updatedAt: "2026-09-03T18:40:00.000Z",
};

const outfit: Outfit = {
  outfitId: "outfit_1",
  wardrobeId: "wd_1",
  name: "Sunday brunch",
  items: [{ itemId: "item_1", slot: "TOP" }],
  createdAt: "2026-09-20T14:00:00.000Z",
  updatedAt: "2026-09-20T14:00:00.000Z",
};

const profile: AiProfile = {
  aiProfileId: "aip_1",
  type: "PERSONAL",
  referenceImages: [],
  status: "READY",
  createdAt: "2026-09-01T12:00:00.000Z",
  updatedAt: "2026-09-01T12:00:00.000Z",
  label: "Weekday look",
};

const createApi = (request: AuthenticatedApi["request"]): AuthenticatedApi => {
  return {
    request,
    getMe: vi.fn(),
  };
};

const asRequest = (request: (path: string) => Promise<unknown>) => {
  return request as AuthenticatedApi["request"];
};

describe("createLiveResourceApi", () => {
  it("calls the inferred wardrobe-backend list and detail routes", async () => {
    const request = vi.fn(async (path: string) => {
      if (path === wardrobeCollectionPath) {
        return { wardrobes: [wardrobe] };
      }
      if (path === getWardrobeApiPath("wd_1")) {
        return wardrobe;
      }
      if (path === getWardrobeItemsApiPath("wd_1")) {
        return { items: [item] };
      }
      throw new Error(`unexpected path ${path}`);
    });
    const api = createLiveResourceApi(createApi(asRequest(request)));

    await expect(api.listWardrobes()).resolves.toEqual({ wardrobes: [wardrobe] });
    await expect(api.getWardrobeDetail("wd_1")).resolves.toEqual({
      wardrobe,
      items: [item],
    });
    expect(request).toHaveBeenCalledWith("/wardrobes");
    expect(request).toHaveBeenCalledWith("/wardrobes/wd_1");
    expect(request).toHaveBeenCalledWith("/wardrobes/wd_1/items");
  });

  it("finds an item by scanning wardrobes when wardrobeId is omitted", async () => {
    const request = vi.fn(async (path: string) => {
      if (path === wardrobeCollectionPath) {
        return { wardrobes: [wardrobe, { ...wardrobe, wardrobeId: "wd_2" }] };
      }
      if (path === getWardrobeItemApiPath("wd_1", "item_1")) {
        throw new ApiError({ status: 404, code: "ITEM_NOT_FOUND" });
      }
      if (path === getWardrobeItemApiPath("wd_2", "item_1")) {
        return { ...item, wardrobeId: "wd_2" };
      }
      throw new Error(`unexpected path ${path}`);
    });
    const api = createLiveResourceApi(createApi(asRequest(request)));

    await expect(api.getItem("item_1")).resolves.toMatchObject({
      itemId: "item_1",
      wardrobeId: "wd_2",
    });
  });

  it("uses the nested item route when wardrobeId is provided", async () => {
    const request = vi.fn(async (path: string) => {
      if (path === getWardrobeItemApiPath("wd_1", "item_1")) {
        return item;
      }
      throw new Error(`unexpected path ${path}`);
    });
    const api = createLiveResourceApi(createApi(asRequest(request)));

    await expect(api.getItem("item_1", "wd_1")).resolves.toEqual(item);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith("/wardrobes/wd_1/items/item_1");
  });

  it("composes outfits from each wardrobe", async () => {
    const request = vi.fn(async (path: string) => {
      if (path === wardrobeCollectionPath) {
        return { wardrobes: [wardrobe] };
      }
      if (path === getWardrobeOutfitsApiPath("wd_1")) {
        return { outfits: [outfit] };
      }
      throw new Error(`unexpected path ${path}`);
    });
    const api = createLiveResourceApi(createApi(asRequest(request)));

    await expect(api.listOutfits()).resolves.toEqual({ outfits: [outfit] });
  });

  it("merges personal and catalog Virtual Profiles when one source fails", async () => {
    const catalog: AiProfile = {
      ...profile,
      aiProfileId: "aip_model",
      type: "GENERIC_MODEL",
      label: "Catalog model",
    };
    const request = vi.fn(async (path: string) => {
      if (path === aiProfilesPath) {
        throw new ApiError({ status: 403, code: "PREMIUM_REQUIRED" });
      }
      if (path === aiProfileModelsPath) {
        return { aiProfiles: [catalog] };
      }
      throw new Error(`unexpected path ${path}`);
    });
    const api = createLiveResourceApi(createApi(asRequest(request)));

    await expect(api.listAiProfiles()).resolves.toEqual({
      aiProfiles: [catalog],
    });
  });

  it("throws when both Virtual Profile sources fail", async () => {
    const request = vi.fn(async () => {
      throw new ApiError({ status: 500, code: "INTERNAL" });
    });
    const api = createLiveResourceApi(createApi(asRequest(request)));

    await expect(api.listAiProfiles()).rejects.toMatchObject({ status: 500 });
  });
});

describe("createResourceApi", () => {
  it("selects the mock implementation when asked", async () => {
    const request = vi.fn();
    const api = createResourceApi(createApi(asRequest(request)), true);

    const { wardrobes } = await api.listWardrobes();
    expect(wardrobes.length).toBeGreaterThan(0);
    expect(request).not.toHaveBeenCalled();
  });

  it("uses live routes when the mock flag is off", async () => {
    const request = vi.fn().mockResolvedValue({ wardrobes: [] });
    const api = createResourceApi(createApi(asRequest(request)), false);

    await expect(api.listWardrobes()).resolves.toEqual({ wardrobes: [] });
    expect(request).toHaveBeenCalledWith("/wardrobes");
  });
});

describe("isNotFoundError", () => {
  it("treats 404 and known not-found codes as missing resources", () => {
    expect(isNotFoundError(new ApiError({ status: 404 }))).toBe(true);
    expect(
      isNotFoundError(new ApiError({ status: 400, code: "ITEM_NOT_FOUND" })),
    ).toBe(true);
    expect(isNotFoundError(new ApiError({ status: 500 }))).toBe(false);
    expect(isNotFoundError(new Error("no"))).toBe(false);
  });
});
