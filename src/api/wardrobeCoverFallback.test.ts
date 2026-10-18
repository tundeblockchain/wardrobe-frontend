import { describe, expect, it, vi } from "vitest";
import { ApiError } from "./httpClient";
import { WARDROBE_COVER_ITEM_LIMIT } from "./resourceApi";
import type { ClothingItem, Wardrobe } from "./resourceTypes";
import {
  getFirstItemImageUrl,
  loadWardrobesWithCoverFallbacks,
  needsWardrobeCoverFallback,
  resolveMissingWardrobeCoverUrls,
} from "./wardrobeCoverFallback";

const wardrobe = (overrides: Partial<Wardrobe> = {}): Wardrobe => {
  return {
    wardrobeId: "wd_1",
    name: "Weekend closet",
    createdAt: "2026-09-03T18:35:00.000Z",
    updatedAt: "2026-09-03T18:35:00.000Z",
    ...overrides,
  };
};

const item = (overrides: Partial<ClothingItem> = {}): ClothingItem => {
  return {
    itemId: "item_1",
    wardrobeId: "wd_1",
    name: "Navy tee",
    category: "TOP",
    processingStatus: "READY",
    createdAt: "2026-09-03T18:40:00.000Z",
    updatedAt: "2026-09-03T18:40:00.000Z",
    ...overrides,
  };
};

describe("wardrobe cover fallback", () => {
  it("needs a fallback only when imageUrl and coverImageUrl are both missing", () => {
    expect(
      needsWardrobeCoverFallback(
        wardrobe({
          imageUrl: "https://cdn.example.com/wardrobe.jpg",
          coverImageUrl: "https://cdn.example.com/cover.jpg",
        }),
      ),
    ).toBe(false);
    expect(
      needsWardrobeCoverFallback(
        wardrobe({ coverImageUrl: "https://cdn.example.com/cover.jpg" }),
      ),
    ).toBe(false);
    expect(needsWardrobeCoverFallback(wardrobe({ coverImageUrl: "  " }))).toBe(
      true,
    );
    expect(needsWardrobeCoverFallback(wardrobe())).toBe(true);
  });

  it("reads the first item photo and ignores later items", () => {
    expect(
      getFirstItemImageUrl([
        item({
          originalImageUrl: "https://cdn.example.com/first.jpg",
          processedImageUrl: "https://cdn.example.com/first-processed.jpg",
        }),
        item({
          itemId: "item_2",
          originalImageUrl: "https://cdn.example.com/second.jpg",
        }),
      ]),
    ).toBe("https://cdn.example.com/first-processed.jpg");
    expect(getFirstItemImageUrl([item()])).toBeUndefined();
    expect(getFirstItemImageUrl([])).toBeUndefined();
  });

  it("skips an imageless first item and uses the oldest item that has a photo", () => {
    expect(
      getFirstItemImageUrl([
        item({
          itemId: "item_newer",
          createdAt: "2026-09-04T18:40:00.000Z",
          originalImageUrl: "https://cdn.example.com/newer.jpg",
        }),
        item({
          itemId: "item_blank",
          createdAt: "2026-09-01T18:40:00.000Z",
        }),
        item({
          itemId: "item_oldest_photo",
          createdAt: "2026-09-02T18:40:00.000Z",
          originalImageUrl: "https://cdn.example.com/oldest-photo.jpg",
        }),
      ]),
    ).toBe("https://cdn.example.com/oldest-photo.jpg");
  });

  it("fetches the first item only for wardrobes without a cover", async () => {
    const listWardrobeItems = vi.fn(async (wardrobeId: string) => {
      return {
        items: [
          item({
            wardrobeId,
            originalImageUrl: `https://cdn.example.com/${wardrobeId}.jpg`,
          }),
        ],
      };
    });

    const fallbackUrls = await resolveMissingWardrobeCoverUrls(
      [
        wardrobe({
          wardrobeId: "wd_image",
          imageUrl: "https://cdn.example.com/wardrobe.jpg",
        }),
        wardrobe({
          wardrobeId: "wd_cover",
          coverImageUrl: "https://cdn.example.com/cover.jpg",
        }),
        wardrobe({ wardrobeId: "wd_empty" }),
      ],
      listWardrobeItems,
    );

    expect(listWardrobeItems).toHaveBeenCalledTimes(1);
    expect(listWardrobeItems).toHaveBeenCalledWith("wd_empty", {
      limit: WARDROBE_COVER_ITEM_LIMIT,
    });
    expect(fallbackUrls).toEqual({
      wd_empty: "https://cdn.example.com/wd_empty.jpg",
    });
  });

  it("requests missing covers in parallel with the cover item limit", async () => {
    const resolvers: Array<(value: { items: ClothingItem[] }) => void> = [];
    const listWardrobeItems = vi.fn(() => {
      return new Promise<{ items: ClothingItem[] }>((resolve) => {
        resolvers.push(resolve);
      });
    });

    const pending = resolveMissingWardrobeCoverUrls(
      [wardrobe({ wardrobeId: "wd_a" }), wardrobe({ wardrobeId: "wd_b" })],
      listWardrobeItems,
    );

    expect(listWardrobeItems).toHaveBeenCalledTimes(2);
    expect(listWardrobeItems).toHaveBeenNthCalledWith(1, "wd_a", {
      limit: WARDROBE_COVER_ITEM_LIMIT,
    });
    expect(listWardrobeItems).toHaveBeenNthCalledWith(2, "wd_b", {
      limit: WARDROBE_COVER_ITEM_LIMIT,
    });
    expect(resolvers).toHaveLength(2);

    resolvers[0]?.({
      items: [item({ originalImageUrl: "https://cdn.example.com/a.jpg" })],
    });
    resolvers[1]?.({
      items: [item({ originalImageUrl: "https://cdn.example.com/b.jpg" })],
    });

    await expect(pending).resolves.toEqual({
      wd_a: "https://cdn.example.com/a.jpg",
      wd_b: "https://cdn.example.com/b.jpg",
    });
  });

  it("uses a later item photo when the oldest item has none", async () => {
    const listWardrobeItems = vi.fn(async () => ({
      items: [
        item({
          itemId: "item_blank",
          createdAt: "2026-09-01T18:40:00.000Z",
        }),
        item({
          itemId: "item_photo",
          createdAt: "2026-09-02T18:40:00.000Z",
          processedImageUrl: "https://cdn.example.com/later-processed.jpg",
          originalImageUrl: "https://cdn.example.com/later-original.jpg",
        }),
      ],
    }));

    const fallbackUrls = await resolveMissingWardrobeCoverUrls(
      [wardrobe({ wardrobeId: "wd_skip" })],
      listWardrobeItems,
    );

    expect(listWardrobeItems).toHaveBeenCalledWith("wd_skip", {
      limit: WARDROBE_COVER_ITEM_LIMIT,
    });
    expect(WARDROBE_COVER_ITEM_LIMIT).toBeGreaterThan(1);
    expect(fallbackUrls).toEqual({
      wd_skip: "https://cdn.example.com/later-processed.jpg",
    });
  });

  it("uses a placeholder when the items request fails or every item is imageless", async () => {
    const listWardrobeItems = vi.fn(async (wardrobeId: string) => {
      if (wardrobeId === "wd_fail") {
        throw new ApiError({
          status: 500,
          code: "INTERNAL",
          message: "Server error",
        });
      }

      return {
        items: [
          item({
            wardrobeId,
            itemId: "item_blank_1",
            createdAt: "2026-09-01T18:40:00.000Z",
          }),
          item({
            wardrobeId,
            itemId: "item_blank_2",
            createdAt: "2026-09-02T18:40:00.000Z",
          }),
        ],
      };
    });

    const fallbackUrls = await resolveMissingWardrobeCoverUrls(
      [
        wardrobe({ wardrobeId: "wd_fail" }),
        wardrobe({ wardrobeId: "wd_blank" }),
      ],
      listWardrobeItems,
    );

    expect(fallbackUrls).toEqual({
      wd_fail: undefined,
      wd_blank: undefined,
    });
  });

  it("copies the first item photo onto wardrobes that have no cover", async () => {
    const listWardrobes = vi.fn(async () => ({
      wardrobes: [
        wardrobe({
          wardrobeId: "wd_image",
          imageUrl: "https://cdn.example.com/wardrobe.jpg",
        }),
        wardrobe({ wardrobeId: "wd_empty" }),
      ],
    }));
    const listWardrobeItems = vi.fn(async () => ({
      items: [item({ originalImageUrl: "https://cdn.example.com/item.jpg" })],
    }));

    const list = await loadWardrobesWithCoverFallbacks({
      listWardrobes,
      listWardrobeItems,
    });

    expect(listWardrobeItems).toHaveBeenCalledTimes(1);
    expect(list.wardrobes[0]?.imageUrl).toBe(
      "https://cdn.example.com/wardrobe.jpg",
    );
    expect(list.wardrobes[1]?.imageUrl).toBe("https://cdn.example.com/item.jpg");
  });
});
