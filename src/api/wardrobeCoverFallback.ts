import { getItemImageUrl, getWardrobeImageUrl } from "./resourceDisplay";
import {
  WARDROBE_COVER_ITEM_LIMIT,
  type ListWardrobeItemsOptions,
  type ResourceApi,
} from "./resourceApi";
import type { ClothingItemList, Wardrobe, WardrobeList } from "./resourceTypes";

export type ListWardrobeItemsFn = (
  wardrobeId: string,
  options?: ListWardrobeItemsOptions,
) => Promise<ClothingItemList>;

export const needsWardrobeCoverFallback = (wardrobe: Wardrobe): boolean => {
  return getWardrobeImageUrl(wardrobe) === undefined;
};

const compareItemsByCreatedAtThenId = (
  left: ClothingItemList["items"][number],
  right: ClothingItemList["items"][number],
): number => {
  if (left.createdAt !== right.createdAt) {
    return left.createdAt < right.createdAt ? -1 : 1;
  }

  if (left.itemId === right.itemId) {
    return 0;
  }

  return left.itemId < right.itemId ? -1 : 1;
};

export const getFirstItemImageUrl = (
  items: ClothingItemList["items"],
): string | undefined => {
  const sortedItems = [...items].sort(compareItemsByCreatedAtThenId);

  for (const item of sortedItems) {
    const imageUrl = getItemImageUrl(item);
    if (imageUrl) {
      return imageUrl;
    }
  }

  return undefined;
};

export const resolveMissingWardrobeCoverUrls = async (
  wardrobes: Wardrobe[],
  listWardrobeItems: ListWardrobeItemsFn,
): Promise<Record<string, string | undefined>> => {
  const missing = wardrobes.filter(needsWardrobeCoverFallback);
  if (missing.length === 0) {
    return {};
  }

  const entries = await Promise.all(
    missing.map(async (wardrobe) => {
      try {
        const { items } = await listWardrobeItems(wardrobe.wardrobeId, {
          limit: WARDROBE_COVER_ITEM_LIMIT,
        });
        return [wardrobe.wardrobeId, getFirstItemImageUrl(items)] as const;
      } catch {
        return [wardrobe.wardrobeId, undefined] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
};

export const loadWardrobesWithCoverFallbacks = async (
  resourceApi: Pick<ResourceApi, "listWardrobes" | "listWardrobeItems">,
): Promise<WardrobeList> => {
  const list = await resourceApi.listWardrobes();
  const fallbackUrls = await resolveMissingWardrobeCoverUrls(
    list.wardrobes,
    resourceApi.listWardrobeItems,
  );

  return {
    wardrobes: list.wardrobes.map((wardrobe) => {
      const fallbackUrl = fallbackUrls[wardrobe.wardrobeId];
      if (!fallbackUrl || getWardrobeImageUrl(wardrobe)) {
        return wardrobe;
      }

      return {
        ...wardrobe,
        imageUrl: fallbackUrl,
      };
    }),
  };
};
