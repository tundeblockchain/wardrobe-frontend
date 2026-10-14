import { describe, expect, it } from "vitest";
import {
  DEFAULT_SUGGESTED_OUTFIT_NAME,
  getRecommendationReason,
  getRecommendationTitle,
  parseOutfitRecommendations,
  readSuggestedOutfitState,
  SUGGESTED_OUTFIT_STATE_KEY,
  toCreateOutfitRequest,
  toOutfitRecommendationList,
  toSuggestedOutfitView,
} from "./outfitRecommendations";
import type { ClothingItem, OutfitRecommendation } from "./resourceTypes";

const recommendation: OutfitRecommendation = {
  name: "Navy + cream look",
  reason: "A weekend look from pieces you already own.",
  items: [
    { itemId: "item_navytee01", slot: "TOP" },
    { itemId: "item_ivorymaxi01", slot: "DRESS" },
  ],
};

const catalogItems: ClothingItem[] = [
  {
    itemId: "item_navytee01",
    wardrobeId: "wd_weekend01",
    name: "Navy tee",
    category: "TOP",
    originalImageUrl: "/navy.jpg",
    processingStatus: "READY",
    createdAt: "2026-09-03T18:40:00.000Z",
    updatedAt: "2026-09-03T18:40:00.000Z",
  },
  {
    itemId: "item_ivorymaxi01",
    wardrobeId: "wd_weekend01",
    name: "Ivory maxi",
    category: "DRESS",
    processedImageUrl: "/ivory.jpg",
    processingStatus: "READY",
    createdAt: "2026-09-04T10:15:00.000Z",
    updatedAt: "2026-09-04T10:15:00.000Z",
  },
];

describe("outfitRecommendations", () => {
  it("parses the object envelope and a bare array", () => {
    expect(
      parseOutfitRecommendations({
        recommendations: [recommendation],
      }),
    ).toEqual([recommendation]);
    expect(parseOutfitRecommendations([recommendation])).toEqual([
      recommendation,
    ]);
    expect(
      toOutfitRecommendationList([
        {
          title: "Evening",
          items: [{ itemId: "item_ivorymaxi01", slot: "DRESS" }],
        },
      ]),
    ).toEqual({
      recommendations: [
        {
          title: "Evening",
          items: [{ itemId: "item_ivorymaxi01", slot: "DRESS" }],
        },
      ],
    });
  });

  it("skips unusable rows and keeps title or reason when present", () => {
    expect(
      parseOutfitRecommendations({
        recommendations: [
          { items: [] },
          { items: [{ itemId: "", slot: "TOP" }] },
          {
            name: "  ",
            title: "Friday night",
            reason: " Neutral copy. ",
            items: [{ itemId: "item_1", slot: "TOP" }],
          },
        ],
      }),
    ).toEqual([
      {
        title: "Friday night",
        reason: "Neutral copy.",
        items: [{ itemId: "item_1", slot: "TOP" }],
      },
    ]);
  });

  it("prefers name, then title, then a fallback for the save payload", () => {
    expect(getRecommendationTitle(recommendation)).toBe("Navy + cream look");
    expect(getRecommendationReason(recommendation)).toBe(
      "A weekend look from pieces you already own.",
    );
    expect(
      getRecommendationTitle({
        title: "Ivory maxi evening",
        items: [{ itemId: "item_ivorymaxi01", slot: "DRESS" }],
      }),
    ).toBe("Ivory maxi evening");
    expect(
      getRecommendationTitle({
        items: [{ itemId: "item_ivorymaxi01", slot: "DRESS" }],
      }),
    ).toBe(DEFAULT_SUGGESTED_OUTFIT_NAME);
    expect(toCreateOutfitRequest(recommendation)).toEqual({
      name: "Navy + cream look",
      items: [
        { itemId: "item_navytee01", slot: "TOP" },
        { itemId: "item_ivorymaxi01", slot: "DRESS" },
      ],
    });
  });

  it("joins catalog photos and names without using a list index", () => {
    expect(toSuggestedOutfitView(recommendation, catalogItems).items).toEqual([
      {
        itemId: "item_navytee01",
        slot: "TOP",
        name: "Navy tee",
        imageUrl: "/navy.jpg",
      },
      {
        itemId: "item_ivorymaxi01",
        slot: "DRESS",
        name: "Ivory maxi",
        imageUrl: "/ivory.jpg",
      },
    ]);
  });

  it("reads a suggestion from router state and rejects missing state", () => {
    const view = toSuggestedOutfitView(recommendation, catalogItems);
    expect(
      readSuggestedOutfitState({ [SUGGESTED_OUTFIT_STATE_KEY]: view }),
    ).toEqual(view);
    expect(readSuggestedOutfitState(undefined)).toBeUndefined();
    expect(readSuggestedOutfitState({})).toBeUndefined();
    expect(readSuggestedOutfitState({ [SUGGESTED_OUTFIT_STATE_KEY]: {} })).toBeUndefined();
  });
});
