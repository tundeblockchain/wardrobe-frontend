import { describe, expect, it, vi } from "vitest";
import {
  CATALOG_LIST_QUERY_KEYS,
  invalidateCatalogLists,
  invalidateResourceQueries,
  resourceQueryKeyMatches,
  subscribeResourceQueryInvalidation,
  WARDROBE_DELETE_INVALIDATION_KEYS,
} from "./resourceQueryCache";

describe("resourceQueryCache", () => {
  it("matches wardrobe, outfit, and item list query keys", () => {
    expect(resourceQueryKeyMatches("wardrobes", ["wardrobes"])).toBe(true);
    expect(resourceQueryKeyMatches("home-wardrobes", ["wardrobes"])).toBe(true);
    expect(resourceQueryKeyMatches("outfits", ["outfits"])).toBe(true);
    expect(resourceQueryKeyMatches("wardrobe-items:wd_1", ["items"])).toBe(true);
    expect(resourceQueryKeyMatches("me", ["me"])).toBe(true);
    expect(resourceQueryKeyMatches("virtual-profiles", ["virtual-profiles"])).toBe(
      true,
    );
    expect(resourceQueryKeyMatches("virtual-try-on", ["virtual-try-on"])).toBe(
      true,
    );
    expect(
      resourceQueryKeyMatches("virtual-profile:aip_1", ["virtual-profile"]),
    ).toBe(true);
    expect(resourceQueryKeyMatches("me", ["wardrobes"])).toBe(false);
  });

  it("notifies subscribers when catalog lists are invalidated", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeResourceQueryInvalidation(listener);

    invalidateCatalogLists();

    expect(listener).toHaveBeenCalledWith([...WARDROBE_DELETE_INVALIDATION_KEYS]);
    expect(WARDROBE_DELETE_INVALIDATION_KEYS).toEqual([
      CATALOG_LIST_QUERY_KEYS.wardrobes,
      CATALOG_LIST_QUERY_KEYS.outfits,
      CATALOG_LIST_QUERY_KEYS.items,
      CATALOG_LIST_QUERY_KEYS.me,
      CATALOG_LIST_QUERY_KEYS.virtualProfiles,
      CATALOG_LIST_QUERY_KEYS.virtualTryOn,
      CATALOG_LIST_QUERY_KEYS.virtualProfile,
    ]);

    unsubscribe();
    invalidateResourceQueries(["wardrobes"]);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
