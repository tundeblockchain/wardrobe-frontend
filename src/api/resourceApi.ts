import { isMockApi } from "../config/mockApi";
import type {
  AuthenticatedApi,
  ListJobEventsOptions,
} from "./authenticatedApi";
import {
  createCheckoutSession as requestCheckoutSession,
  createPortalSession as requestPortalSession,
  type BillingInterval,
  type BillingSession,
  type CheckoutTier,
} from "./billing";
import { ApiError, isApiError } from "./httpClient";
import { createMockResourceApi } from "./mockResourceApi";
import {
  type AccountDeleteResult,
  type AiProfile,
  type AiProfileList,
  type AttachAiProfileReferenceImagesRequest,
  type ClothingItem,
  type ClothingItemList,
  type ContentWipeResult,
  type CreateAiProfileRequest,
  type CreateAiProfileUploadRequest,
  type CreateItemRequest,
  type CreateOutfitRequest,
  type CreateRenderRequest,
  type CreateUploadRequest,
  type CreateUploadResponse,
  type CreateWardrobeRequest,
  type Entitlement,
  type JobEventList,
  type Outfit,
  type OutfitList,
  type OutfitRender,
  type UpdateAiProfileRequest,
  type UpdateItemRequest,
  type UpdateOutfitRequest,
  type UpdateWardrobeRequest,
  type Wardrobe,
  type WardrobeDetail,
  type WardrobeList,
} from "./resourceTypes";

export type { ListJobEventsOptions } from "./authenticatedApi";

export const wardrobeCollectionPath = "/wardrobes";
export const itemCollectionPath = "/items";
export const outfitCollectionPath = "/outfits";
export const aiProfilesPath = "/ai-profiles";
export const aiProfileModelsPath = "/ai-profiles/models";
export const uploadsPath = "/uploads";

export const getWardrobeApiPath = (wardrobeId: string): string => {
  return `${wardrobeCollectionPath}/${encodeURIComponent(wardrobeId)}`;
};

export const getWardrobeItemsApiPath = (wardrobeId: string): string => {
  return `${getWardrobeApiPath(wardrobeId)}/items`;
};

export type ListWardrobeItemsOptions = {
  limit?: number;
};

/** Smallest page size the items list route accepts as a query param. */
export const WARDROBE_COVER_ITEM_LIMIT = 1;

export const getWardrobeItemsListApiPath = (
  wardrobeId: string,
  options: ListWardrobeItemsOptions = {},
): string => {
  const path = getWardrobeItemsApiPath(wardrobeId);
  if (options.limit === undefined) {
    return path;
  }

  const params = new URLSearchParams({
    limit: String(options.limit),
  });
  return `${path}?${params.toString()}`;
};

export const getWardrobeItemApiPath = (
  wardrobeId: string,
  itemId: string,
): string => {
  return `${getWardrobeItemsApiPath(wardrobeId)}/${encodeURIComponent(itemId)}`;
};

export const getWardrobeOutfitsApiPath = (wardrobeId: string): string => {
  return `${getWardrobeApiPath(wardrobeId)}/outfits`;
};

export const getWardrobeOutfitApiPath = (
  wardrobeId: string,
  outfitId: string,
): string => {
  return `${getWardrobeOutfitsApiPath(wardrobeId)}/${encodeURIComponent(outfitId)}`;
};

export const getItemApiPath = (itemId: string): string => {
  return `${itemCollectionPath}/${encodeURIComponent(itemId)}`;
};

export const getAiProfileApiPath = (aiProfileId: string): string => {
  return `${aiProfilesPath}/${encodeURIComponent(aiProfileId)}`;
};

export const getAiProfileUploadsApiPath = (aiProfileId: string): string => {
  return `${getAiProfileApiPath(aiProfileId)}/uploads`;
};

export const getAiProfileReferenceImagesApiPath = (
  aiProfileId: string,
): string => {
  return `${getAiProfileApiPath(aiProfileId)}/reference-images`;
};

export const getWardrobeItemRenderApiPath = (
  wardrobeId: string,
  itemId: string,
): string => {
  return `${getWardrobeItemApiPath(wardrobeId, itemId)}/render`;
};

export const getWardrobeOutfitRenderApiPath = (
  wardrobeId: string,
  outfitId: string,
): string => {
  return `${getWardrobeOutfitApiPath(wardrobeId, outfitId)}/render`;
};

export type ResourceApi = {
  getMe: () => Promise<Entitlement>;
  deleteAccount: () => Promise<AccountDeleteResult>;
  clearContent: () => Promise<ContentWipeResult>;
  listJobEvents: (options?: ListJobEventsOptions) => Promise<JobEventList>;
  createCheckoutSession: (
    tier: CheckoutTier,
    interval?: BillingInterval,
  ) => Promise<BillingSession>;
  createPortalSession: () => Promise<BillingSession>;
  listWardrobes: () => Promise<WardrobeList>;
  getWardrobe: (wardrobeId: string) => Promise<Wardrobe>;
  createWardrobe: (body: CreateWardrobeRequest) => Promise<Wardrobe>;
  updateWardrobe: (
    wardrobeId: string,
    body: UpdateWardrobeRequest,
  ) => Promise<Wardrobe>;
  deleteWardrobe: (wardrobeId: string) => Promise<void>;
  listWardrobeItems: (
    wardrobeId: string,
    options?: ListWardrobeItemsOptions,
  ) => Promise<ClothingItemList>;
  getItem: (itemId: string) => Promise<ClothingItem>;
  createItem: (
    wardrobeId: string,
    body: CreateItemRequest,
  ) => Promise<ClothingItem>;
  updateItem: (
    wardrobeId: string,
    itemId: string,
    body: UpdateItemRequest,
  ) => Promise<ClothingItem>;
  deleteItem: (wardrobeId: string, itemId: string) => Promise<void>;
  getWardrobeDetail: (wardrobeId: string) => Promise<WardrobeDetail>;
  listOutfits: () => Promise<OutfitList>;
  getOutfit: (wardrobeId: string, outfitId: string) => Promise<Outfit>;
  createOutfit: (
    wardrobeId: string,
    body: CreateOutfitRequest,
  ) => Promise<Outfit>;
  updateOutfit: (
    wardrobeId: string,
    outfitId: string,
    body: UpdateOutfitRequest,
  ) => Promise<Outfit>;
  listAiProfiles: () => Promise<AiProfileList>;
  listGenericAiProfiles: () => Promise<AiProfileList>;
  getAiProfile: (aiProfileId: string) => Promise<AiProfile>;
  createAiProfile: (body: CreateAiProfileRequest) => Promise<AiProfile>;
  updateAiProfile: (
    aiProfileId: string,
    body: UpdateAiProfileRequest,
  ) => Promise<AiProfile>;
  deleteAiProfile: (aiProfileId: string) => Promise<void>;
  createAiProfileUpload: (
    aiProfileId: string,
    body: CreateAiProfileUploadRequest,
  ) => Promise<CreateUploadResponse>;
  attachAiProfileReferenceImages: (
    aiProfileId: string,
    body: AttachAiProfileReferenceImagesRequest,
  ) => Promise<AiProfile>;
  renderItem: (
    wardrobeId: string,
    itemId: string,
    body: CreateRenderRequest,
  ) => Promise<ClothingItem>;
  renderOutfit: (
    wardrobeId: string,
    outfitId: string,
    body: CreateRenderRequest,
  ) => Promise<Outfit>;
  getItemRender: (
    wardrobeId: string,
    itemId: string,
  ) => Promise<OutfitRender>;
  getOutfitRender: (
    wardrobeId: string,
    outfitId: string,
  ) => Promise<OutfitRender>;
  createUpload: (body: CreateUploadRequest) => Promise<CreateUploadResponse>;
};

const itemNotFoundError = (): ApiError => {
  return new ApiError({
    status: 404,
    code: "ITEM_NOT_FOUND",
    message: "Clothing item not found.",
  });
};

export const createLiveResourceApi = (api: AuthenticatedApi): ResourceApi => {
  const getMe = (): Promise<Entitlement> => {
    return api.getMe();
  };

  const deleteAccount = (): Promise<AccountDeleteResult> => {
    return api.deleteAccount();
  };

  const clearContent = (): Promise<ContentWipeResult> => {
    return api.clearContent();
  };

  const listJobEvents = (
    options?: ListJobEventsOptions,
  ): Promise<JobEventList> => {
    return api.listJobEvents(options);
  };

  const createCheckoutSession = (
    tier: CheckoutTier,
    interval?: BillingInterval,
  ): Promise<BillingSession> => {
    return requestCheckoutSession(api, tier, interval);
  };

  const createPortalSession = (): Promise<BillingSession> => {
    return requestPortalSession(api);
  };

  const listWardrobes = (): Promise<WardrobeList> => {
    return api.request<WardrobeList>(wardrobeCollectionPath);
  };

  const getWardrobe = (wardrobeId: string): Promise<Wardrobe> => {
    return api.request<Wardrobe>(getWardrobeApiPath(wardrobeId));
  };

  const listWardrobeItems = (
    wardrobeId: string,
    options?: ListWardrobeItemsOptions,
  ): Promise<ClothingItemList> => {
    return api.request<ClothingItemList>(
      getWardrobeItemsListApiPath(wardrobeId, options),
    );
  };

  const getItem = (itemId: string): Promise<ClothingItem> => {
    const trimmedItemId = itemId.trim();
    if (!trimmedItemId) {
      return Promise.reject(itemNotFoundError());
    }

    return api.request<ClothingItem>(getItemApiPath(trimmedItemId));
  };

  const getWardrobeDetail = async (
    wardrobeId: string,
  ): Promise<WardrobeDetail> => {
    const [wardrobe, itemList] = await Promise.all([
      getWardrobe(wardrobeId),
      listWardrobeItems(wardrobeId),
    ]);

    return {
      wardrobe,
      items: itemList.items,
    };
  };

  const createWardrobe = (body: CreateWardrobeRequest): Promise<Wardrobe> => {
    return api.request<Wardrobe>(wardrobeCollectionPath, {
      method: "POST",
      body,
    });
  };

  const updateWardrobe = (
    wardrobeId: string,
    body: UpdateWardrobeRequest,
  ): Promise<Wardrobe> => {
    return api.request<Wardrobe>(getWardrobeApiPath(wardrobeId), {
      method: "PATCH",
      body,
    });
  };

  const deleteWardrobe = (wardrobeId: string): Promise<void> => {
    return api.request<void>(getWardrobeApiPath(wardrobeId), {
      method: "DELETE",
    });
  };

  const createItem = (
    wardrobeId: string,
    body: CreateItemRequest,
  ): Promise<ClothingItem> => {
    return api.request<ClothingItem>(getWardrobeItemsApiPath(wardrobeId), {
      method: "POST",
      body,
    });
  };

  const updateItem = (
    wardrobeId: string,
    itemId: string,
    body: UpdateItemRequest,
  ): Promise<ClothingItem> => {
    return api.request<ClothingItem>(
      getWardrobeItemApiPath(wardrobeId, itemId),
      {
        method: "PATCH",
        body,
      },
    );
  };

  const deleteItem = async (
    wardrobeId: string,
    itemId: string,
  ): Promise<void> => {
    await api.request<unknown>(getWardrobeItemApiPath(wardrobeId, itemId), {
      method: "DELETE",
    });
  };

  const listOutfits = (): Promise<OutfitList> => {
    return api.request<OutfitList>(outfitCollectionPath);
  };

  const getOutfit = (wardrobeId: string, outfitId: string): Promise<Outfit> => {
    return api.request<Outfit>(getWardrobeOutfitApiPath(wardrobeId, outfitId));
  };

  const createOutfit = (
    wardrobeId: string,
    body: CreateOutfitRequest,
  ): Promise<Outfit> => {
    return api.request<Outfit>(getWardrobeOutfitsApiPath(wardrobeId), {
      method: "POST",
      body,
    });
  };

  const updateOutfit = (
    wardrobeId: string,
    outfitId: string,
    body: UpdateOutfitRequest,
  ): Promise<Outfit> => {
    return api.request<Outfit>(getWardrobeOutfitApiPath(wardrobeId, outfitId), {
      method: "PATCH",
      body,
    });
  };

  const listAiProfiles = (): Promise<AiProfileList> => {
    return api.request<AiProfileList>(aiProfilesPath);
  };

  const listGenericAiProfiles = (): Promise<AiProfileList> => {
    return api.request<AiProfileList>(aiProfileModelsPath);
  };

  const getAiProfile = (aiProfileId: string): Promise<AiProfile> => {
    return api.request<AiProfile>(getAiProfileApiPath(aiProfileId));
  };

  const createAiProfile = (body: CreateAiProfileRequest): Promise<AiProfile> => {
    return api.request<AiProfile>(aiProfilesPath, {
      method: "POST",
      body,
    });
  };

  const updateAiProfile = (
    aiProfileId: string,
    body: UpdateAiProfileRequest,
  ): Promise<AiProfile> => {
    return api.request<AiProfile>(getAiProfileApiPath(aiProfileId), {
      method: "PATCH",
      body,
    });
  };

  const deleteAiProfile = async (aiProfileId: string): Promise<void> => {
    await api.request<unknown>(getAiProfileApiPath(aiProfileId), {
      method: "DELETE",
    });
  };

  const createAiProfileUpload = (
    aiProfileId: string,
    body: CreateAiProfileUploadRequest,
  ): Promise<CreateUploadResponse> => {
    return api.request<CreateUploadResponse>(
      getAiProfileUploadsApiPath(aiProfileId),
      {
        method: "POST",
        body,
      },
    );
  };

  const attachAiProfileReferenceImages = (
    aiProfileId: string,
    body: AttachAiProfileReferenceImagesRequest,
  ): Promise<AiProfile> => {
    return api.request<AiProfile>(
      getAiProfileReferenceImagesApiPath(aiProfileId),
      {
        method: "POST",
        body,
      },
    );
  };

  const renderItem = (
    wardrobeId: string,
    itemId: string,
    body: CreateRenderRequest,
  ): Promise<ClothingItem> => {
    return api.request<ClothingItem>(
      getWardrobeItemRenderApiPath(wardrobeId, itemId),
      {
        method: "POST",
        body,
      },
    );
  };

  const renderOutfit = (
    wardrobeId: string,
    outfitId: string,
    body: CreateRenderRequest,
  ): Promise<Outfit> => {
    return api.request<Outfit>(
      getWardrobeOutfitRenderApiPath(wardrobeId, outfitId),
      {
        method: "POST",
        body,
      },
    );
  };

  const getItemRender = (
    wardrobeId: string,
    itemId: string,
  ): Promise<OutfitRender> => {
    return api.request<OutfitRender>(
      getWardrobeItemRenderApiPath(wardrobeId, itemId),
    );
  };

  const getOutfitRender = (
    wardrobeId: string,
    outfitId: string,
  ): Promise<OutfitRender> => {
    return api.request<OutfitRender>(
      getWardrobeOutfitRenderApiPath(wardrobeId, outfitId),
    );
  };

  const createUpload = (
    body: CreateUploadRequest,
  ): Promise<CreateUploadResponse> => {
    return api.request<CreateUploadResponse>(uploadsPath, {
      method: "POST",
      body,
    });
  };

  return {
    getMe,
    deleteAccount,
    clearContent,
    listJobEvents,
    createCheckoutSession,
    createPortalSession,
    listWardrobes,
    getWardrobe,
    createWardrobe,
    updateWardrobe,
    deleteWardrobe,
    listWardrobeItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    getWardrobeDetail,
    listOutfits,
    getOutfit,
    createOutfit,
    updateOutfit,
    listAiProfiles,
    listGenericAiProfiles,
    getAiProfile,
    createAiProfile,
    updateAiProfile,
    deleteAiProfile,
    createAiProfileUpload,
    attachAiProfileReferenceImages,
    renderItem,
    renderOutfit,
    getItemRender,
    getOutfitRender,
    createUpload,
  };
};

export const createResourceApi = (
  api: AuthenticatedApi,
  useMock = isMockApi(),
): ResourceApi => {
  if (useMock) {
    return createMockResourceApi();
  }

  return createLiveResourceApi(api);
};

export const isNotFoundError = (error: unknown): error is ApiError => {
  if (!isApiError(error)) {
    return false;
  }

  if (error.status === 404) {
    return true;
  }

  return (
    error.code === "WARDROBE_NOT_FOUND" ||
    error.code === "ITEM_NOT_FOUND" ||
    error.code === "OUTFIT_NOT_FOUND" ||
    error.code === "AI_PROFILE_NOT_FOUND"
  );
};

export { isCatalogLimitError } from "./catalogLimits";
export { isEntitlementAiRequiredError } from "./entitlementGating";
