import { describe, expect, it } from "vitest";
import { mockItems, mockOutfits, mockWardrobes } from "../../api/mockResourceApi";
import {
  VIRTUAL_TRY_ON_ITEM_QUERY_PARAM,
  VIRTUAL_TRY_ON_OUTFIT_QUERY_PARAM,
  WARDROBE_ID_QUERY_PARAM,
} from "../../routes/paths";
import {
  getVirtualTryOnInitialSelection,
  readVirtualTryOnSelection,
} from "./virtualTryOnSelection";

const catalog = {
  wardrobes: mockWardrobes,
  items: mockItems,
  outfits: mockOutfits,
};

describe("virtualTryOnSelection", () => {
  it("defaults to Clothing items mode with no preselection", () => {
    const selection = getVirtualTryOnInitialSelection(
      catalog,
      new URLSearchParams(),
    );

    expect(selection).toEqual({
      source: "items",
      wardrobeId: "wd_weekend01",
      selectedItemIds: [],
      outfitId: "",
    });
  });

  it("preselects a clothing item and keeps Clothing items mode", () => {
    const searchParams = new URLSearchParams({
      [VIRTUAL_TRY_ON_ITEM_QUERY_PARAM]: "item_navytee01",
      [WARDROBE_ID_QUERY_PARAM]: "wd_weekend01",
    });

    expect(readVirtualTryOnSelection(searchParams)).toEqual({
      wardrobeId: "wd_weekend01",
      itemId: "item_navytee01",
      outfitId: undefined,
    });
    expect(getVirtualTryOnInitialSelection(catalog, searchParams)).toEqual({
      source: "items",
      wardrobeId: "wd_weekend01",
      selectedItemIds: ["item_navytee01"],
      outfitId: "",
    });
  });

  it("preselects an outfit from query params or route state", () => {
    const searchParams = new URLSearchParams({
      [VIRTUAL_TRY_ON_OUTFIT_QUERY_PARAM]: "outfit_brunch01",
      [WARDROBE_ID_QUERY_PARAM]: "wd_weekend01",
    });

    expect(getVirtualTryOnInitialSelection(catalog, searchParams)).toEqual({
      source: "outfit",
      wardrobeId: "wd_weekend01",
      selectedItemIds: [],
      outfitId: "outfit_brunch01",
    });
    expect(
      getVirtualTryOnInitialSelection(catalog, new URLSearchParams(), {
        outfitId: "outfit_brunch01",
        wardrobeId: "wd_weekend01",
      }),
    ).toEqual({
      source: "outfit",
      wardrobeId: "wd_weekend01",
      selectedItemIds: [],
      outfitId: "outfit_brunch01",
    });
  });

  it("keeps Clothing items mode when an item and outfit are both provided", () => {
    const searchParams = new URLSearchParams({
      [VIRTUAL_TRY_ON_ITEM_QUERY_PARAM]: "item_navytee01",
      [VIRTUAL_TRY_ON_OUTFIT_QUERY_PARAM]: "outfit_brunch01",
    });

    expect(getVirtualTryOnInitialSelection(catalog, searchParams)).toEqual({
      source: "items",
      wardrobeId: "wd_weekend01",
      selectedItemIds: ["item_navytee01"],
      outfitId: "",
    });
  });
});
