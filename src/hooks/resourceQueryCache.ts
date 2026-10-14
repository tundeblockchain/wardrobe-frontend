export const CATALOG_LIST_QUERY_KEYS = {
  wardrobes: "wardrobes",
  outfits: "outfits",
  items: "items",
  me: "me",
  virtualProfiles: "virtual-profiles",
  virtualTryOn: "virtual-try-on",
  virtualProfile: "virtual-profile",
  recommendations: "recommendations",
} as const;

export const SESSION_QUERY_CACHE_KEYS = {
  me: "me",
  wardrobes: "wardrobes",
  plan: "plan",
  presets: "presets",
  billingInterval: "billingInterval",
} as const;

const cachedQueries = new Map<string, unknown>();

export const getCachedResourceQuery = (queryKey: string): unknown => {
  return cachedQueries.get(queryKey);
};

export const setCachedResourceQuery = (
  queryKey: string,
  value: unknown,
): void => {
  cachedQueries.set(queryKey, value);
};

export const clearResourceQueryCache = (): void => {
  cachedQueries.clear();
};

export const WARDROBE_DELETE_INVALIDATION_KEYS = [
  CATALOG_LIST_QUERY_KEYS.wardrobes,
  CATALOG_LIST_QUERY_KEYS.outfits,
  CATALOG_LIST_QUERY_KEYS.items,
  CATALOG_LIST_QUERY_KEYS.me,
  CATALOG_LIST_QUERY_KEYS.virtualProfiles,
  CATALOG_LIST_QUERY_KEYS.virtualTryOn,
  CATALOG_LIST_QUERY_KEYS.virtualProfile,
  CATALOG_LIST_QUERY_KEYS.recommendations,
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
