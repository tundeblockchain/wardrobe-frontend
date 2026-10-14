import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedApi } from "./authenticatedApi";
import { ApiError } from "./httpClient";
import {
  aiProfileModelsPath,
  aiProfilesPath,
  createLiveResourceApi,
  createResourceApi,
  getAiProfileApiPath,
  getAiProfileReferenceImagesApiPath,
  getAiProfileUploadsApiPath,
  getItemApiPath,
  getWardrobeApiPath,
  getWardrobeItemApiPath,
  getWardrobeItemRenderApiPath,
  getWardrobeItemsApiPath,
  getWardrobeItemsListApiPath,
  WARDROBE_COVER_ITEM_LIMIT,
  getWardrobeOutfitApiPath,
  getWardrobeOutfitRenderApiPath,
  getWardrobeOutfitsApiPath,
  isEntitlementAiRequiredError,
  isNotFoundError,
  itemCollectionPath,
  outfitCollectionPath,
  uploadsPath,
  wardrobeCollectionPath,
} from "./resourceApi";
import { isCatalogLimitError } from "./catalogLimits";
import type {
  AiProfile,
  ClothingItem,
  Entitlement,
  Outfit,
  Wardrobe,
} from "./resourceTypes";

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

const aiProfile: AiProfile = {
  aiProfileId: "aip_1",
  type: "PERSONAL",
  referenceImages: [],
  status: "READY",
  createdAt: "2026-09-01T12:00:00.000Z",
  updatedAt: "2026-09-01T12:00:00.000Z",
  label: "Weekday look",
};

const createApi = (
  request: AuthenticatedApi["request"],
  getMe: AuthenticatedApi["getMe"] = vi.fn(),
  deleteAccount: AuthenticatedApi["deleteAccount"] = vi.fn(),
  clearContent: AuthenticatedApi["clearContent"] = vi.fn(),
  listJobEvents: AuthenticatedApi["listJobEvents"] = vi.fn(),
): AuthenticatedApi => {
  return {
    request,
    getMe,
    deleteAccount,
    clearContent,
    listJobEvents,
  };
};

const asRequest = (
  request: (path: string, options?: { method?: string; body?: unknown }) => Promise<unknown>,
) => {
  return request as AuthenticatedApi["request"];
};

describe("createLiveResourceApi", () => {
  it("reads GET /me entitlement through the authenticated client", async () => {
    const getMe = vi.fn().mockResolvedValue(entitlement);
    const api = createLiveResourceApi(createApi(vi.fn(), getMe));

    await expect(api.getMe()).resolves.toEqual(entitlement);
    expect(getMe).toHaveBeenCalledTimes(1);
  });

  it("deletes the account with DELETE /me", async () => {
    const deleteAccount = vi.fn().mockResolvedValue({ deleted: true });
    const api = createLiveResourceApi(createApi(vi.fn(), vi.fn(), deleteAccount));

    await expect(api.deleteAccount()).resolves.toEqual({ deleted: true });
    expect(deleteAccount).toHaveBeenCalledTimes(1);
  });

  it("clears content and lists job events through the authenticated client", async () => {
    const wipe = {
      keepAccount: true,
      deletedWardrobes: 1,
      deletedItems: 1,
      deletedOutfits: 0,
      deletedAiProfiles: 0,
      deletedS3Objects: 1,
      s3Failures: 0,
    };
    const events = { events: [], unreadCount: 0 };
    const clearContent = vi.fn().mockResolvedValue(wipe);
    const listJobEvents = vi.fn().mockResolvedValue(events);
    const api = createLiveResourceApi(
      createApi(vi.fn(), vi.fn(), vi.fn(), clearContent, listJobEvents),
    );

    await expect(api.clearContent()).resolves.toEqual(wipe);
    await expect(api.listJobEvents({ unreadOnly: false })).resolves.toEqual(
      events,
    );
    expect(clearContent).toHaveBeenCalledTimes(1);
    expect(listJobEvents).toHaveBeenCalledWith({ unreadOnly: false });
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

  it("lists wardrobe items with the smallest supported limit", async () => {
    const request = vi.fn(async (path: string) => {
      if (path === getWardrobeItemsListApiPath("wd_1", { limit: 1 })) {
        return { items: [item] };
      }
      throw new Error(`unexpected path ${path}`);
    });
    const api = createLiveResourceApi(createApi(asRequest(request)));

    await expect(
      api.listWardrobeItems("wd_1", { limit: WARDROBE_COVER_ITEM_LIMIT }),
    ).resolves.toEqual({ items: [item] });
    expect(request).toHaveBeenCalledWith("/wardrobes/wd_1/items?limit=1");
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

  it("creates and edits catalog resources on the nested write routes", async () => {
    const request = vi.fn(async (path: string, options?: { method?: string; body?: unknown }) => {
      if (path === wardrobeCollectionPath && options?.method === "POST") {
        return { ...wardrobe, name: "New closet" };
      }
      if (path === getWardrobeApiPath("wd_1") && options?.method === "PATCH") {
        return { ...wardrobe, name: "Updated closet" };
      }
      if (path === getWardrobeItemsApiPath("wd_1") && options?.method === "POST") {
        return { ...item, name: "New tee" };
      }
      if (
        path === getWardrobeItemApiPath("wd_1", "item_1") &&
        options?.method === "PATCH"
      ) {
        return { ...item, name: "Updated tee" };
      }
      if (
        path === getWardrobeItemApiPath("wd_1", "item_1") &&
        options?.method === "DELETE"
      ) {
        return undefined;
      }
      if (
        path === getWardrobeOutfitsApiPath("wd_1") &&
        options?.method === "POST"
      ) {
        return { ...outfit, name: "New look" };
      }
      if (
        path === getWardrobeOutfitApiPath("wd_1", "outfit_1") &&
        options?.method === "PATCH"
      ) {
        return { ...outfit, name: "Updated look" };
      }
      if (path === uploadsPath && options?.method === "POST") {
        return {
          uploadUrl: "https://uploads.example.com/presigned/jpg",
          objectKey: "users/user-1/uploads/upl_1.jpg",
          expiresIn: 900,
        };
      }
      throw new Error(`unexpected ${options?.method} ${path}`);
    });
    const api = createLiveResourceApi(createApi(asRequest(request)));

    await expect(api.createWardrobe({ name: "New closet" })).resolves.toMatchObject({
      name: "New closet",
    });
    await expect(
      api.updateWardrobe("wd_1", { name: "Updated closet" }),
    ).resolves.toMatchObject({ name: "Updated closet" });
    await expect(
      api.createItem("wd_1", {
        name: "New tee",
        category: "TOP",
        imageKey: "users/user-1/uploads/upl_1.jpg",
      }),
    ).resolves.toMatchObject({ name: "New tee" });
    await expect(
      api.updateItem("wd_1", "item_1", { name: "Updated tee" }),
    ).resolves.toMatchObject({ name: "Updated tee" });
    await expect(api.deleteItem("wd_1", "item_1")).resolves.toBeUndefined();
    await expect(
      api.createOutfit("wd_1", {
        name: "New look",
        items: [{ itemId: "item_1", slot: "TOP" }],
      }),
    ).resolves.toMatchObject({ name: "New look" });
    await expect(
      api.updateOutfit("wd_1", "outfit_1", { name: "Updated look" }),
    ).resolves.toMatchObject({ name: "Updated look" });
    await expect(
      api.createUpload({
        contentType: "image/jpeg",
        purpose: "WARDROBE_ITEM",
        contentLength: 12,
      }),
    ).resolves.toMatchObject({
      objectKey: "users/user-1/uploads/upl_1.jpg",
    });

    expect(request).toHaveBeenCalledWith("/wardrobes", {
      method: "POST",
      body: { name: "New closet" },
    });
    expect(request).toHaveBeenCalledWith("/wardrobes/wd_1/items", {
      method: "POST",
      body: {
        name: "New tee",
        category: "TOP",
        imageKey: "users/user-1/uploads/upl_1.jpg",
      },
    });
    expect(request).toHaveBeenCalledWith("/wardrobes/wd_1/items/item_1", {
      method: "DELETE",
    });
    expect(request).toHaveBeenCalledWith("/uploads", {
      method: "POST",
      body: {
        contentType: "image/jpeg",
        purpose: "WARDROBE_ITEM",
        contentLength: 12,
      },
    });
  });

  it("deletes a wardrobe with DELETE /wardrobes/{id}", async () => {
    const request = vi.fn(async (path: string, options?: { method?: string }) => {
      if (path === getWardrobeApiPath("wd_1") && options?.method === "DELETE") {
        return undefined;
      }
      throw new Error(`unexpected ${options?.method} ${path}`);
    });
    const api = createLiveResourceApi(createApi(asRequest(request)));

    await expect(api.deleteWardrobe("wd_1")).resolves.toBeUndefined();
    expect(request).toHaveBeenCalledWith("/wardrobes/wd_1", {
      method: "DELETE",
    });
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

  it("writes Virtual Profiles and starts Virtual Try On on the nested routes", async () => {
    const request = vi.fn(async (path: string, options?: { method?: string; body?: unknown }) => {
      if (path === aiProfilesPath && options?.method === "POST") {
        return { ...aiProfile, label: "Home look" };
      }
      if (path === getAiProfileApiPath("aip_1") && options?.method === "PATCH") {
        return { ...aiProfile, label: "Updated look" };
      }
      if (path === getAiProfileApiPath("aip_1") && options?.method === "DELETE") {
        return undefined;
      }
      if (path === getAiProfileApiPath("aip_1")) {
        return aiProfile;
      }
      if (path === aiProfileModelsPath) {
        return { aiProfiles: [] };
      }
      if (
        path === getAiProfileUploadsApiPath("aip_1") &&
        options?.method === "POST"
      ) {
        return {
          uploadUrl: "https://uploads.example.com/presigned/profile.jpg",
          objectKey: "users/user-1/ai-profiles/aip_1/upl_1.jpg",
          expiresIn: 900,
        };
      }
      if (
        path === getAiProfileReferenceImagesApiPath("aip_1") &&
        options?.method === "POST"
      ) {
        return {
          ...aiProfile,
          referenceImages: ["users/user-1/ai-profiles/aip_1/upl_1.jpg"],
        };
      }
      if (
        path === getWardrobeItemRenderApiPath("wd_1", "item_1") &&
        options?.method === "POST"
      ) {
        return {
          ...item,
          render: { status: "PENDING", aiProfileId: "aip_1" },
        };
      }
      if (
        path === getWardrobeOutfitRenderApiPath("wd_1", "outfit_1") &&
        options?.method === "POST"
      ) {
        return {
          ...outfit,
          render: { status: "PENDING", aiProfileId: "aip_1" },
        };
      }
      if (path === getWardrobeItemRenderApiPath("wd_1", "item_1")) {
        return { status: "READY", aiProfileId: "aip_1" };
      }
      if (path === getWardrobeOutfitRenderApiPath("wd_1", "outfit_1")) {
        return { status: "READY", aiProfileId: "aip_1" };
      }
      throw new Error(`unexpected ${options?.method ?? "GET"} ${path}`);
    });
    const api = createLiveResourceApi(createApi(asRequest(request)));

    await expect(
      api.createAiProfile({ type: "PERSONAL", label: "Home look" }),
    ).resolves.toMatchObject({ label: "Home look" });
    await expect(api.getAiProfile("aip_1")).resolves.toEqual(aiProfile);
    await expect(
      api.updateAiProfile("aip_1", { label: "Updated look" }),
    ).resolves.toMatchObject({ label: "Updated look" });
    await expect(api.deleteAiProfile("aip_1")).resolves.toBeUndefined();
    await expect(api.listGenericAiProfiles()).resolves.toEqual({
      aiProfiles: [],
    });
    await expect(
      api.createAiProfileUpload("aip_1", {
        contentType: "image/jpeg",
        purpose: "AI_PROFILE_REFERENCE",
        contentLength: 12,
      }),
    ).resolves.toMatchObject({
      objectKey: "users/user-1/ai-profiles/aip_1/upl_1.jpg",
    });
    await expect(
      api.attachAiProfileReferenceImages("aip_1", {
        objectKey: "users/user-1/ai-profiles/aip_1/upl_1.jpg",
        setAsMain: true,
      }),
    ).resolves.toMatchObject({
      referenceImages: ["users/user-1/ai-profiles/aip_1/upl_1.jpg"],
    });
    await expect(
      api.renderItem("wd_1", "item_1", { aiProfileId: "aip_1" }),
    ).resolves.toMatchObject({
      render: { status: "PENDING", aiProfileId: "aip_1" },
    });
    await expect(
      api.renderOutfit("wd_1", "outfit_1", { aiProfileId: "aip_1" }),
    ).resolves.toMatchObject({
      render: { status: "PENDING", aiProfileId: "aip_1" },
    });
    await expect(api.getItemRender("wd_1", "item_1")).resolves.toMatchObject({
      status: "READY",
    });
    await expect(api.getOutfitRender("wd_1", "outfit_1")).resolves.toMatchObject({
      status: "READY",
    });

    expect(request).toHaveBeenCalledWith("/ai-profiles", {
      method: "POST",
      body: { type: "PERSONAL", label: "Home look" },
    });
    expect(request).toHaveBeenCalledWith("/ai-profiles/aip_1/uploads", {
      method: "POST",
      body: {
        contentType: "image/jpeg",
        purpose: "AI_PROFILE_REFERENCE",
        contentLength: 12,
      },
    });
    expect(request).toHaveBeenCalledWith(
      "/wardrobes/wd_1/items/item_1/render",
      {
        method: "POST",
        body: { aiProfileId: "aip_1" },
      },
    );
    expect(request).toHaveBeenCalledWith(
      "/wardrobes/wd_1/outfits/outfit_1/render",
      {
        method: "POST",
        body: { aiProfileId: "aip_1" },
      },
    );
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
    expect(
      isCatalogLimitError(
        new ApiError({ status: 403, code: "ENTITLEMENT_ITEM_LIMIT" }),
      ),
    ).toBe(true);
  });
});
