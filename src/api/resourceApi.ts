import { isMockApi } from "../config/mockApi";
import type { AuthenticatedApi } from "./authenticatedApi";
import { ApiError, isApiError } from "./httpClient";
import { createMockResourceApi } from "./mockResourceApi";
import type {
  AiProfile,
  AiProfileList,
  ClothingItem,
  ClothingItemList,
  OutfitList,
  Wardrobe,
  WardrobeDetail,
  WardrobeList,
} from "./resourceTypes";

export const wardrobeCollectionPath = "/wardrobes";
export const aiProfilesPath = "/ai-profiles";
export const aiProfileModelsPath = "/ai-profiles/models";

export const getWardrobeApiPath = (wardrobeId: string): string => {
  return `${wardrobeCollectionPath}/${encodeURIComponent(wardrobeId)}`;
};

export const getWardrobeItemsApiPath = (wardrobeId: string): string => {
  return `${getWardrobeApiPath(wardrobeId)}/items`;
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

export type ResourceApi = {
  listWardrobes: () => Promise<WardrobeList>;
  getWardrobe: (wardrobeId: string) => Promise<Wardrobe>;
  listWardrobeItems: (wardrobeId: string) => Promise<ClothingItemList>;
  getWardrobeItem: (
    wardrobeId: string,
    itemId: string,
  ) => Promise<ClothingItem>;
  getItem: (itemId: string, wardrobeId?: string) => Promise<ClothingItem>;
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

const isNotFoundStatus = (error: unknown): boolean => {
  return isApiError(error) && error.status === 404;
};

const uniqueAiProfiles = (profiles: AiProfile[]): AiProfile[] => {
  const seen = new Set<string>();
  const unique: AiProfile[] = [];

  profiles.forEach((profile) => {
    if (seen.has(profile.aiProfileId)) {
      return;
    }

    seen.add(profile.aiProfileId);
    unique.push(profile);
  });

  return unique;
};

const readSettledProfiles = (
  result: PromiseSettledResult<AiProfileList>,
): { profiles?: AiProfile[]; error?: unknown } => {
  if (result.status === "fulfilled") {
    return { profiles: result.value.aiProfiles };
  }

  return { error: result.reason };
};

export const createLiveResourceApi = (api: AuthenticatedApi): ResourceApi => {
  const listWardrobes = (): Promise<WardrobeList> => {
    return api.request<WardrobeList>(wardrobeCollectionPath);
  };

  const getWardrobe = (wardrobeId: string): Promise<Wardrobe> => {
    return api.request<Wardrobe>(getWardrobeApiPath(wardrobeId));
  };

  const listWardrobeItems = (wardrobeId: string): Promise<ClothingItemList> => {
    return api.request<ClothingItemList>(getWardrobeItemsApiPath(wardrobeId));
  };

  const getWardrobeItem = (
    wardrobeId: string,
    itemId: string,
  ): Promise<ClothingItem> => {
    return api.request<ClothingItem>(
      getWardrobeItemApiPath(wardrobeId, itemId),
    );
  };

  const getItem = async (
    itemId: string,
    wardrobeId?: string,
  ): Promise<ClothingItem> => {
    const trimmedItemId = itemId.trim();
    if (!trimmedItemId) {
      throw itemNotFoundError();
    }

    const trimmedWardrobeId = wardrobeId?.trim();
    if (trimmedWardrobeId) {
      return getWardrobeItem(trimmedWardrobeId, trimmedItemId);
    }

    const { wardrobes } = await listWardrobes();
    const lookups = await Promise.all(
      wardrobes.map(async (wardrobe) => {
        try {
          return await getWardrobeItem(wardrobe.wardrobeId, trimmedItemId);
        } catch (error) {
          if (isNotFoundStatus(error)) {
            return undefined;
          }

          throw error;
        }
      }),
    );

    const found = lookups.find((item): item is ClothingItem => item !== undefined);
    if (!found) {
      throw itemNotFoundError();
    }

    return found;
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

  const listOutfits = async (): Promise<OutfitList> => {
    const { wardrobes } = await listWardrobes();
    const outfitLists = await Promise.all(
      wardrobes.map((wardrobe) =>
        api.request<OutfitList>(getWardrobeOutfitsApiPath(wardrobe.wardrobeId)),
      ),
    );

    const outfits = outfitLists.flatMap((list) => list.outfits);
    return { outfits };
  };

  const listAiProfiles = async (): Promise<AiProfileList> => {
    const [personalResult, catalogResult] = await Promise.allSettled([
      api.request<AiProfileList>(aiProfilesPath),
      api.request<AiProfileList>(aiProfileModelsPath),
    ]);

    const personal = readSettledProfiles(personalResult);
    const catalog = readSettledProfiles(catalogResult);

    if (personal.profiles === undefined && catalog.profiles === undefined) {
      throw personal.error ?? catalog.error;
    }

    return {
      aiProfiles: uniqueAiProfiles([
        ...(personal.profiles ?? []),
        ...(catalog.profiles ?? []),
      ]),
    };
  };

  return {
    listWardrobes,
    getWardrobe,
    listWardrobeItems,
    getWardrobeItem,
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
