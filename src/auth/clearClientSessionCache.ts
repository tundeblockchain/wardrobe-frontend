import { invalidateResourceQueries as invalidateAllResourceQueries } from "../hooks/resourceQueryInvalidation";
import {
  CATALOG_LIST_QUERY_KEYS,
  clearResourceQueryCache,
  invalidateResourceQueries,
  SESSION_QUERY_CACHE_KEYS,
  WARDROBE_DELETE_INVALIDATION_KEYS,
} from "../hooks/resourceQueryCache";

const SESSION_INVALIDATION_KEYS = [
  SESSION_QUERY_CACHE_KEYS.me,
  SESSION_QUERY_CACHE_KEYS.wardrobes,
  SESSION_QUERY_CACHE_KEYS.plan,
  SESSION_QUERY_CACHE_KEYS.presets,
  SESSION_QUERY_CACHE_KEYS.billingInterval,
  "settings-plan",
  "paidTier",
  "generic-ai-profiles",
  "interval",
  ...WARDROBE_DELETE_INVALIDATION_KEYS,
  CATALOG_LIST_QUERY_KEYS.recommendations,
] as const;

export const clearClientSessionCache = (): void => {
  clearResourceQueryCache();
  invalidateAllResourceQueries();
  invalidateResourceQueries(SESSION_INVALIDATION_KEYS);
};
