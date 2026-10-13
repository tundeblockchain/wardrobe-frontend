import { describe, expect, it } from "vitest";
import {
  getAiProfileDisplayName,
  getAiProfileImageUrl,
  getAiProfileTypeLabel,
  getClothingCategoryLabel,
  getColourLabel,
  getColourSwatchHex,
  getItemDisplayName,
  getItemImageUrl,
  getOutfitImageUrl,
  getProcessingStatusLabel,
  getWardrobeImageUrl,
} from "./resourceDisplay";
import type { AiProfile, ClothingItem, Outfit, Wardrobe } from "./resourceTypes";

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

describe("resource display helpers", () => {
  it("formats controlled tokens for display", () => {
    expect(getClothingCategoryLabel("OUTERWEAR")).toBe("Outerwear");
    expect(getColourLabel("MULTICOLOUR")).toBe("Multicolour");
    expect(getColourSwatchHex("NAVY")).toBe("#1B365D");
    expect(getColourSwatchHex("unknown")).toBe("#9E9E9E");
    expect(getItemDisplayName({ name: "Navy tee" })).toBe("Navy tee");
    expect(getItemDisplayName({ name: "  " })).toBe("Item");
    expect(getProcessingStatusLabel("PROCESSING")).toBe("Processing");
    expect(getAiProfileTypeLabel("PERSONAL")).toBe("Personal");
    expect(getAiProfileTypeLabel("GENERIC_MODEL")).toBe("Catalog");
  });

  it("prefers processed item image URLs from the API", () => {
    expect(
      getItemImageUrl(
        item({
          originalImageUrl: "https://cdn.example.com/original.jpg",
          processedImageUrl: "https://cdn.example.com/processed.jpg",
        }),
      ),
    ).toBe("https://cdn.example.com/processed.jpg");
    expect(
      getItemImageUrl(item({ originalImageUrl: "https://cdn.example.com/original.jpg" })),
    ).toBe("https://cdn.example.com/original.jpg");
    expect(getItemImageUrl(item())).toBeUndefined();
  });

  it("reads outfit and Virtual Profile image URLs from the API", () => {
    const outfit: Outfit = {
      outfitId: "outfit_1",
      wardrobeId: "wd_1",
      name: "Brunch",
      items: [],
      render: {
        status: "READY",
        aiProfileId: "aip_1",
        imageUrl: "https://cdn.example.com/try-on.jpg",
      },
      createdAt: "2026-09-20T14:00:00.000Z",
      updatedAt: "2026-09-20T14:00:00.000Z",
    };
    const profile: AiProfile = {
      aiProfileId: "aip_1",
      type: "PERSONAL",
      referenceImages: [],
      status: "READY",
      createdAt: "2026-09-01T12:00:00.000Z",
      updatedAt: "2026-09-01T12:00:00.000Z",
      frontImageUrl: "https://cdn.example.com/profile.jpg",
    };

    expect(getOutfitImageUrl(outfit)).toBe("https://cdn.example.com/try-on.jpg");
    expect(getAiProfileImageUrl(profile)).toBe("https://cdn.example.com/profile.jpg");
    expect(getAiProfileDisplayName(profile)).toBe("Virtual Profile");
    expect(getAiProfileDisplayName({ ...profile, label: "Weekday look" })).toBe(
      "Weekday look",
    );
  });

  it("prefers a wardrobe image, then coverImageUrl, then no image", () => {
    const wardrobe = (overrides: Partial<Wardrobe> = {}): Wardrobe => {
      return {
        wardrobeId: "wd_1",
        name: "Weekend closet",
        createdAt: "2026-09-03T18:35:00.000Z",
        updatedAt: "2026-09-03T18:35:00.000Z",
        ...overrides,
      };
    };

    expect(
      getWardrobeImageUrl(
        wardrobe({
          imageUrl: "https://cdn.example.com/wardrobe.jpg",
          coverImageUrl: "https://cdn.example.com/cover.jpg",
        }),
      ),
    ).toBe("https://cdn.example.com/wardrobe.jpg");
    expect(
      getWardrobeImageUrl(
        wardrobe({ coverImageUrl: "https://cdn.example.com/cover.jpg" }),
      ),
    ).toBe("https://cdn.example.com/cover.jpg");
    expect(getWardrobeImageUrl(wardrobe({ coverImageUrl: "  " }))).toBeUndefined();
    expect(getWardrobeImageUrl(wardrobe())).toBeUndefined();
  });
});
