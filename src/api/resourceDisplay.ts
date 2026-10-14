import { mapRenderImageUrls } from "./renderImages";
import type {
  AiProfile,
  AiProfileStatus,
  AiProfileType,
  ClothingCategory,
  ClothingItem,
  Outfit,
  ProcessingStatus,
  Wardrobe,
} from "./resourceTypes";

const formatToken = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }

  return trimmed
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const getClothingCategoryLabel = (category: ClothingCategory): string => {
  return formatToken(category);
};

export const getColourLabel = (colour: string): string => {
  return formatToken(colour);
};

const COLOUR_SWATCH_HEX: Record<string, string> = {
  BEIGE: "#D8C3A5",
  BLACK: "#1A1A1A",
  BLUE: "#1565C0",
  BROWN: "#6D4C41",
  BURGUNDY: "#6D1B2B",
  CREAM: "#F3E6C8",
  GOLD: "#C9A227",
  GREEN: "#2E7D32",
  GREY: "#757575",
  GRAY: "#757575",
  KHAKI: "#BDB76B",
  MULTICOLOUR: "#9E9E9E",
  NAVY: "#1B365D",
  OLIVE: "#6B8E23",
  ORANGE: "#EF6C00",
  PINK: "#EC407A",
  PURPLE: "#7B1FA2",
  RED: "#C62828",
  SILVER: "#B0B0B0",
  TEAL: "#00897B",
  WHITE: "#F4F4F4",
  YELLOW: "#F9A825",
};

export const getColourSwatchHex = (colour: string): string => {
  const token = colour.trim().toUpperCase().replace(/\s+/g, "_");
  return COLOUR_SWATCH_HEX[token] ?? "#9E9E9E";
};

export const getItemDisplayName = (item: { name?: string | null }): string => {
  const name = item.name?.trim();
  if (name) {
    return name;
  }

  return "Item";
};

export const getProcessingStatusLabel = (status: ProcessingStatus): string => {
  return formatToken(status);
};

export const isPresetVirtualProfile = (profile: Pick<AiProfile, "type">): boolean => {
  return profile.type === "GENERIC_MODEL";
};

export const isOwnedPersonalVirtualProfile = (
  profile: Pick<AiProfile, "type">,
): boolean => {
  return profile.type === "PERSONAL";
};

export const getAiProfileTypeLabel = (type: AiProfileType): string => {
  if (type === "GENERIC_MODEL") {
    return "Preset";
  }

  return "Personal";
};

export const getAiProfileStatusLabel = (status: AiProfileStatus): string => {
  return formatToken(status);
};

export const getAiProfileDisplayName = (profile: AiProfile): string => {
  const label = profile.label?.trim();
  if (label) {
    return label;
  }

  return "Virtual Profile";
};

export const getItemImageUrl = (item: ClothingItem): string | undefined => {
  return item.processedImageUrl ?? item.originalImageUrl;
};

const readOptionalUrl = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed;
};

export const getWardrobeImageUrl = (wardrobe: Wardrobe): string | undefined => {
  return readOptionalUrl(wardrobe.imageUrl) ?? readOptionalUrl(wardrobe.coverImageUrl);
};

export const getOutfitImageUrl = (outfit: Outfit): string | undefined => {
  return mapRenderImageUrls(outfit)[0];
};

export const getAiProfileImageUrl = (profile: AiProfile): string | undefined => {
  return profile.frontImageUrl;
};
