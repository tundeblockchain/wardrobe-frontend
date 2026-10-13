import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedApi } from "./authenticatedApi";
import { ApiError } from "./httpClient";
import {
  aiProfilesPath,
  createLiveResourceApi,
  createResourceApi,
  getItemApiPath,
  getWardrobeApiPath,
  getWardrobeItemsApiPath,
  isEntitlementAiRequiredError,
  isNotFoundError,
  itemCollectionPath,
  outfitCollectionPath,
  wardrobeCollectionPath,
} from "./resourceApi";
import type { ClothingItem, Entitlement, Outfit, Wardrobe } from "./resourceTypes";

const entitlement: Entitlement = {
  userId: "user-1",
  tier: "PREMIUM",
  status: "ACTIVE",
  features: {
    unlimitedCatalog: true,
    aiTryOn: true,
    otherAi: true,
  },
  limits: null,
  usage: { wardrobes: 1, items: 1, outfits: 1 },
  store: "STRIPE",
  updatedAt: "2026-10-01T09:12:00.000Z",
};

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

const createApi = (
  request: AuthenticatedApi["request"],
  getMe: AuthenticatedApi["getMe"] = vi.fn(),
): AuthenticatedApi => {
  return {
    request,
    getMe,
  };
};

const asRequest = (request: (path: string) => Promise<unknown>) => {
  return request as AuthenticatedApi["request"];
};

describe("createLiveResourceApi", () => {
  it("reads GET /me entitlement through the authenticated client", async () => {
    const getMe = vi.fn().mockResolvedValue(entitlement);
    const api = createLiveResourceApi(createApi(vi.fn(), getMe));

    await expect(api.getMe()).resolves.toEqual(entitlement);
    expect(getMe).toHaveBeenCalledTimes(1);
  });

  it("calls GET /wardrobes and wardrobe detail plus items", async () => {
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

  it("loads an item from GET /items/{itemId}", async () => {
    const request = vi.fn(async (path: string) => {
      if (path === getItemApiPath("item_1")) {
        return item;
      }
      throw new Error(`unexpected path ${path}`);
    });
    const api = createLiveResourceApi(createApi(asRequest(request)));

    await expect(api.getItem("item_1")).resolves.toEqual(item);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith("/items/item_1");
  });

  it("lists outfits from GET /outfits", async () => {
    const request = vi.fn(async (path: string) => {
      if (path === outfitCollectionPath) {
        return { outfits: [outfit] };
      }
      throw new Error(`unexpected path ${path}`);
    });
    const api = createLiveResourceApi(createApi(asRequest(request)));

    await expect(api.listOutfits()).resolves.toEqual({ outfits: [outfit] });
    expect(request).toHaveBeenCalledWith("/outfits");
  });

  it("lists Virtual Profiles from GET /ai-profiles", async () => {
    const request = vi.fn(async (path: string) => {
      if (path === aiProfilesPath) {
        return { aiProfiles: [] };
      }
      throw new Error(`unexpected path ${path}`);
    });
    const api = createLiveResourceApi(createApi(asRequest(request)));

    await expect(api.listAiProfiles()).resolves.toEqual({ aiProfiles: [] });
    expect(request).toHaveBeenCalledWith("/ai-profiles");
  });

  it("surfaces 404 from GET /items/{itemId} for another user's item", async () => {
    const request = vi.fn(async () => {
      throw new ApiError({ status: 404, code: "ITEM_NOT_FOUND" });
    });
    const api = createLiveResourceApi(createApi(asRequest(request)));

    await expect(api.getItem("item_other")).rejects.toMatchObject({
      status: 404,
      code: "ITEM_NOT_FOUND",
    });
    expect(request).toHaveBeenCalledWith(`${itemCollectionPath}/item_other`);
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

describe("error helpers", () => {
  it("treats 404 and known not-found codes as missing resources", () => {
    expect(isNotFoundError(new ApiError({ status: 404 }))).toBe(true);
    expect(
      isNotFoundError(new ApiError({ status: 400, code: "ITEM_NOT_FOUND" })),
    ).toBe(true);
    expect(isNotFoundError(new ApiError({ status: 500 }))).toBe(false);
    expect(isNotFoundError(new Error("no"))).toBe(false);
  });

  it("detects the Premium Virtual Profile entitlement error", () => {
    expect(
      isEntitlementAiRequiredError(
        new ApiError({
          status: 403,
          code: "ENTITLEMENT_AI_REQUIRED",
        }),
      ),
    ).toBe(true);
    expect(
      isEntitlementAiRequiredError(new ApiError({ status: 403, code: "FORBIDDEN" })),
    ).toBe(false);
    expect(isEntitlementAiRequiredError(new ApiError({ status: 500 }))).toBe(
      false,
    );
  });
});
