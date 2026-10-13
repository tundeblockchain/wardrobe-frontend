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

export const getProcessingStatusLabel = (status: ProcessingStatus): string => {
  return formatToken(status);
};

export const getAiProfileTypeLabel = (type: AiProfileType): string => {
  if (type === "GENERIC_MODEL") {
    return "Catalog";
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
