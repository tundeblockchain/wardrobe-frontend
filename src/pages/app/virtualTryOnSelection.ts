import {
  VIRTUAL_TRY_ON_ITEM_QUERY_PARAM,
  VIRTUAL_TRY_ON_OUTFIT_QUERY_PARAM,
  WARDROBE_ID_QUERY_PARAM,
} from "../../routes/paths";
import type { ClothingItem, Outfit, Wardrobe } from "../../api/resourceTypes";
import type { VirtualTryOnSource } from "./virtualTryOnPickOrder";

export type VirtualTryOnSelection = {
  wardrobeId?: string;
  itemId?: string;
  outfitId?: string;
};

export type VirtualTryOnInitialSelection = {
  source: VirtualTryOnSource;
  wardrobeId: string;
  selectedItemIds: string[];
  outfitId: string;
};

const readTrimmed = (value: string | null | undefined): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const readVirtualTryOnSelection = (
  searchParams: URLSearchParams,
  state?: unknown,
): VirtualTryOnSelection => {
  const fromState = isRecord(state) ? state : {};

  return {
    wardrobeId:
      readTrimmed(searchParams.get(WARDROBE_ID_QUERY_PARAM)) ??
      readTrimmed(
        typeof fromState.wardrobeId === "string"
          ? fromState.wardrobeId
          : undefined,
      ),
    itemId:
      readTrimmed(searchParams.get(VIRTUAL_TRY_ON_ITEM_QUERY_PARAM)) ??
      readTrimmed(
        typeof fromState.itemId === "string" ? fromState.itemId : undefined,
      ),
    outfitId:
      readTrimmed(searchParams.get(VIRTUAL_TRY_ON_OUTFIT_QUERY_PARAM)) ??
      readTrimmed(
        typeof fromState.outfitId === "string" ? fromState.outfitId : undefined,
      ),
  };
};

export const getVirtualTryOnInitialSelection = (
  data: {
    wardrobes: Wardrobe[];
    items: ClothingItem[];
    outfits: Outfit[];
  },
  searchParams: URLSearchParams,
  state?: unknown,
): VirtualTryOnInitialSelection => {
  const selection = readVirtualTryOnSelection(searchParams, state);
  const selectedItem = selection.itemId
    ? data.items.find((item) => item.itemId === selection.itemId)
    : undefined;
  const selectedOutfit =
    !selectedItem && selection.outfitId
      ? data.outfits.find((outfit) => outfit.outfitId === selection.outfitId)
      : undefined;
  const source: VirtualTryOnSource = selectedOutfit ? "outfit" : "items";
  const wardrobeId =
    selection.wardrobeId ??
    selectedItem?.wardrobeId ??
    selectedOutfit?.wardrobeId ??
    data.wardrobes[0]?.wardrobeId ??
    "";
  const selectedItemIds =
    selectedItem && selectedItem.wardrobeId === wardrobeId
      ? [selectedItem.itemId]
      : [];
  const outfitId =
    selectedOutfit && selectedOutfit.wardrobeId === wardrobeId
      ? selectedOutfit.outfitId
      : "";

  return {
    source,
    wardrobeId,
    selectedItemIds,
    outfitId,
  };
};
