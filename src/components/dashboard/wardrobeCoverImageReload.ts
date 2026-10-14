import { CATALOG_LIST_QUERY_KEYS, invalidateResourceQueries } from "../../hooks/resourceQueryCache";

const retriedWardrobeCoverIds = new Set<string>();

export const resetWardrobeCoverImageRetries = (): void => {
  retriedWardrobeCoverIds.clear();
};

export const handleWardrobeCoverImageError = (wardrobeId: string): boolean => {
  if (retriedWardrobeCoverIds.has(wardrobeId)) {
    return false;
  }

  retriedWardrobeCoverIds.add(wardrobeId);
  invalidateResourceQueries([CATALOG_LIST_QUERY_KEYS.wardrobes]);
  return true;
};
