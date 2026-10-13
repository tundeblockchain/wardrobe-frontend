import { isMockApi } from "../config/mockApi";
import type { AuthenticatedApi } from "./authenticatedApi";
import { ApiError, isApiError } from "./httpClient";
import { createMockResourceApi } from "./mockResourceApi";
import {
  ENTITLEMENT_AI_REQUIRED_CODE,
  type AiProfileList,
  type ClothingItem,
  type ClothingItemList,
  type Entitlement,
  type OutfitList,
  type Wardrobe,
  type WardrobeDetail,
  type WardrobeList,
} from "./resourceTypes";

export const wardrobeCollectionPath = "/wardrobes";
export const itemCollectionPath = "/items";
export const outfitCollectionPath = "/outfits";
export const aiProfilesPath = "/ai-profiles";

export const getWardrobeApiPath = (wardrobeId: string): string => {
  return `${wardrobeCollectionPath}/${encodeURIComponent(wardrobeId)}`;
};

export const getWardrobeItemsApiPath = (wardrobeId: string): string => {
  return `${getWardrobeApiPath(wardrobeId)}/items`;
};

export const getItemApiPath = (itemId: string): string => {
  return `${itemCollectionPath}/${encodeURIComponent(itemId)}`;
};

export type ResourceApi = {
  getMe: () => Promise<Entitlement>;
  listWardrobes: () => Promise<WardrobeList>;
  getWardrobe: (wardrobeId: string) => Promise<Wardrobe>;
  listWardrobeItems: (wardrobeId: string) => Promise<ClothingItemList>;
  getItem: (itemId: string) => Promise<ClothingItem>;
  getWardrobeDetail: (wardrobeId: string) => Promise<WardrobeDetail>;
  listOutfits: () => Promise<OutfitList>;
  listAiProfiles: () => Promise<AiProfileList>;
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

  const listWardrobeItems = (wardrobeId: string): Promise<ClothingItemList> => {
    return api.request<ClothingItemList>(getWardrobeItemsApiPath(wardrobeId));
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

  const listOutfits = (): Promise<OutfitList> => {
    return api.request<OutfitList>(outfitCollectionPath);
  };

  const listAiProfiles = (): Promise<AiProfileList> => {
    return api.request<AiProfileList>(aiProfilesPath);
  };

  return {
    getMe,
    listWardrobes,
    getWardrobe,
    listWardrobeItems,
    getItem,
    getWardrobeDetail,
    listOutfits,
    listAiProfiles,
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
