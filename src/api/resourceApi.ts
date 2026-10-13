import { isMockApi } from "../config/mockApi";
import type { AuthenticatedApi } from "./authenticatedApi";
import { ApiError, isApiError } from "./httpClient";
import { createMockResourceApi } from "./mockResourceApi";
import {
  ENTITLEMENT_AI_REQUIRED_CODE,
  type AiProfileList,
  type ClothingItem,
  type ClothingItemList,
  type CreateItemRequest,
  type CreateOutfitRequest,
  type CreateUploadRequest,
  type CreateUploadResponse,
  type CreateWardrobeRequest,
  type Entitlement,
  type Outfit,
  type OutfitList,
  type UpdateItemRequest,
  type UpdateOutfitRequest,
  type UpdateWardrobeRequest,
  type Wardrobe,
  type WardrobeDetail,
  type WardrobeList,
} from "./resourceTypes";

export const wardrobeCollectionPath = "/wardrobes";
export const itemCollectionPath = "/items";
export const outfitCollectionPath = "/outfits";
export const aiProfilesPath = "/ai-profiles";
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

export type ResourceApi = {
  getMe: () => Promise<Entitlement>;
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
    listWardrobes,
    getWardrobe,
    createWardrobe,
    updateWardrobe,
    deleteWardrobe,
    listWardrobeItems,
    getItem,
    createItem,
    updateItem,
    getWardrobeDetail,
    listOutfits,
    getOutfit,
    createOutfit,
    updateOutfit,
    listAiProfiles,
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

export const isEntitlementAiRequiredError = (
  error: unknown,
): error is ApiError => {
  return (
    isApiError(error) &&
    error.status === 403 &&
    error.code === ENTITLEMENT_AI_REQUIRED_CODE
  );
};

export { isCatalogLimitError } from "./catalogLimits";
