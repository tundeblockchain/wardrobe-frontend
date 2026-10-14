import { CATALOG_LIST_QUERY_KEYS, invalidateResourceQueries } from "../../hooks/resourceQueryCache";

/** Session-scoped: survives card remounts after list invalidation so a failing cover cannot loop. */
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
