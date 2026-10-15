export type VirtualTryOnSource = "items" | "outfit";

export const hasVirtualTryOnClothingSelection = (
  source: VirtualTryOnSource,
  selectedItemIds: readonly string[],
  outfitId: string,
): boolean => {
  if (source === "items") {
    return selectedItemIds.length > 0;
  }

  return outfitId.trim().length > 0;
};

export const canSelectVirtualProfile = hasVirtualTryOnClothingSelection;
