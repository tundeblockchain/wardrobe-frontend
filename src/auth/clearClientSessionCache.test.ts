import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearResourceQueryCache,
  getCachedResourceQuery,
  SESSION_QUERY_CACHE_KEYS,
  setCachedResourceQuery,
  subscribeResourceQueryInvalidation,
} from "../hooks/resourceQueryCache";
import { subscribeResourceQueryInvalidation as subscribeAllInvalidation } from "../hooks/resourceQueryInvalidation";
import { clearClientSessionCache } from "./clearClientSessionCache";

describe("clearClientSessionCache", () => {
  afterEach(() => {
    clearResourceQueryCache();
  });

  it("clears cached /me, wardrobes, plan, presets, and billing interval", () => {
    const keyedListener = vi.fn();
    const allListener = vi.fn();
    const unsubscribeKeyed = subscribeResourceQueryInvalidation(keyedListener);
    const unsubscribeAll = subscribeAllInvalidation(allListener);

    setCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.me, { id: "user-1" });
    setCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.wardrobes, [{ id: "w1" }]);
    setCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.plan, {
      paidTier: { tier: "premium" },
    });
    setCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.presets, [
      { aiProfileId: "preset-1" },
    ]);
    setCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.billingInterval, "yearly");

    clearClientSessionCache();

    expect(getCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.me)).toBeUndefined();
    expect(
      getCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.wardrobes),
    ).toBeUndefined();
    expect(getCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.plan)).toBeUndefined();
    expect(
      getCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.presets),
    ).toBeUndefined();
    expect(
      getCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.billingInterval),
    ).toBeUndefined();
    expect(allListener).toHaveBeenCalledTimes(1);
    expect(keyedListener).toHaveBeenCalledTimes(1);
    expect(keyedListener.mock.calls[0]?.[0]).toEqual(
      expect.arrayContaining([
        SESSION_QUERY_CACHE_KEYS.me,
        SESSION_QUERY_CACHE_KEYS.wardrobes,
        SESSION_QUERY_CACHE_KEYS.plan,
        SESSION_QUERY_CACHE_KEYS.presets,
        SESSION_QUERY_CACHE_KEYS.billingInterval,
        "paidTier",
      ]),
    );

    unsubscribeKeyed();
    unsubscribeAll();
  });
});
