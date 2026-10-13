export const CATALOG_LIST_QUERY_KEYS = {
  wardrobes: "wardrobes",
  outfits: "outfits",
  items: "items",
  me: "me",
} as const;

export const WARDROBE_DELETE_INVALIDATION_KEYS = [
  CATALOG_LIST_QUERY_KEYS.wardrobes,
  CATALOG_LIST_QUERY_KEYS.outfits,
  CATALOG_LIST_QUERY_KEYS.items,
  CATALOG_LIST_QUERY_KEYS.me,
] as const;

type ResourceQueryInvalidationListener = (keys: readonly string[]) => void;

const listeners = new Set<ResourceQueryInvalidationListener>();

export const resourceQueryKeyMatches = (
  queryKey: string,
  keys: readonly string[],
): boolean => {
  return keys.some((key) => {
    if (queryKey === key) {
      return true;
    }

    if (queryKey.startsWith(`${key}:`) || queryKey.startsWith(`${key}-`)) {
      return true;
    }

    const segments = queryKey.split(/[:/-]/);
    return segments.includes(key);
  });
};

export const subscribeResourceQueryInvalidation = (
  listener: ResourceQueryInvalidationListener,
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const invalidateResourceQueries = (keys: readonly string[]): void => {
  listeners.forEach((listener) => {
    listener(keys);
  });
};

export const invalidateCatalogLists = (): void => {
  invalidateResourceQueries(WARDROBE_DELETE_INVALIDATION_KEYS);
};
