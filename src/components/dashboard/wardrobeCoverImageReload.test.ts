import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  CATALOG_LIST_QUERY_KEYS,
  invalidateResourceQueries,
} from "../../hooks/resourceQueryCache";
import {
  handleWardrobeCoverImageError,
  resetWardrobeCoverImageRetries,
} from "./wardrobeCoverImageReload";

vi.mock("../../hooks/resourceQueryCache", async () => {
  const actual = await vi.importActual<
    typeof import("../../hooks/resourceQueryCache")
  >("../../hooks/resourceQueryCache");
  return {
    ...actual,
    invalidateResourceQueries: vi.fn(),
  };
});

describe("wardrobe cover image reload", () => {
  beforeEach(() => {
    resetWardrobeCoverImageRetries();
    vi.mocked(invalidateResourceQueries).mockClear();
  });

  it("invalidates the wardrobe list once per wardrobe", () => {
    expect(handleWardrobeCoverImageError("wd_1")).toBe(true);
    expect(handleWardrobeCoverImageError("wd_1")).toBe(false);
    expect(handleWardrobeCoverImageError("wd_2")).toBe(true);

    expect(invalidateResourceQueries).toHaveBeenCalledTimes(2);
    expect(invalidateResourceQueries).toHaveBeenNthCalledWith(1, [
      CATALOG_LIST_QUERY_KEYS.wardrobes,
    ]);
    expect(invalidateResourceQueries).toHaveBeenNthCalledWith(2, [
      CATALOG_LIST_QUERY_KEYS.wardrobes,
    ]);
  });
});
