import { canUseOutfitSuggestions } from "./entitlementGating";
import { parseOutfitRecommendations } from "./outfitRecommendations";
import type { ResourceApi } from "./resourceApi";
import type {
  ClothingItem,
  Entitlement,
  OutfitRecommendation,
  Wardrobe,
} from "./resourceTypes";

export type OutfitRecommendationsData = {
  entitlement: Entitlement;
  wardrobe: Wardrobe;
  items: ClothingItem[];
  recommendations: OutfitRecommendation[];
};

export const loadOutfitRecommendations = async (
  resourceApi: ResourceApi,
  wardrobeId: string,
  signal: AbortSignal,
): Promise<OutfitRecommendationsData> => {
  const [entitlement, detail] = await Promise.all([
    resourceApi.getMe(),
    resourceApi.getWardrobeDetail(wardrobeId),
  ]);

  if (!canUseOutfitSuggestions(entitlement)) {
    return {
      entitlement,
      wardrobe: detail.wardrobe,
      items: detail.items,
      recommendations: [],
    };
  }

  const recommendationList = await resourceApi.listRecommendations(
    wardrobeId,
    { signal },
  );

  return {
    entitlement,
    wardrobe: detail.wardrobe,
    items: detail.items,
    recommendations: parseOutfitRecommendations(recommendationList),
  };
};
