/**
 * Authenticated catalog DTOs inferred from wardrobe-backend handlers
 * (`src/functions/wardrobes|items|outfits|ai-profiles` and `src/shared/types.ts`).
 * WARDROBE-173 is confirming the public route shapes — keep this module as the
 * single place to adjust field names and wrappers.
 */

export const CLOTHING_CATEGORIES = [
  "TOP",
  "BOTTOM",
  "DRESS",
  "OUTERWEAR",
  "SHOES",
  "ACCESSORY",
  "BAG",
] as const;

export type ClothingCategory = (typeof CLOTHING_CATEGORIES)[number];

export const PROCESSING_STATUSES = [
  "PENDING",
  "PROCESSING",
  "READY",
  "FAILED",
] as const;

export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number];

export const RENDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "READY",
  "FAILED",
] as const;

export type RenderStatus = (typeof RENDER_STATUSES)[number];

export const AI_PROFILE_TYPES = ["PERSONAL", "GENERIC_MODEL"] as const;

export type AiProfileType = (typeof AI_PROFILE_TYPES)[number];

export const AI_PROFILE_STATUSES = [
  "PENDING",
  "PROCESSING",
  "READY",
  "FAILED",
] as const;

export type AiProfileStatus = (typeof AI_PROFILE_STATUSES)[number];

export type OutfitSlot = ClothingCategory;

export type Wardrobe = {
  wardrobeId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

/** GET /wardrobes */
export type WardrobeList = {
  wardrobes: Wardrobe[];
};

export type ClothingItemImage = {
  originalKey: string;
  processedKey?: string;
};

export type OutfitRender = {
  status: RenderStatus;
  aiProfileId: string;
  imageKey?: string;
  /** Short-lived presigned GET. Display only — never persist. */
  imageUrl?: string;
  error?: string;
};

export type OutfitRenderHistoryEntry = {
  imageKey: string;
  createdAt: string;
  aiProfileId: string;
  imageUrl?: string;
};

export type ClothingItem = {
  itemId: string;
  wardrobeId: string;
  name: string;
  category: ClothingCategory;
  subcategory?: string;
  colours?: string[];
  brand?: string;
  acquiredAt?: string;
  image?: ClothingItemImage;
  originalImageUrl?: string;
  processedImageUrl?: string;
  processingStatus: ProcessingStatus;
  processingError?: string;
  render?: OutfitRender;
  renderHistory?: OutfitRenderHistoryEntry[];
  renderImageUrls?: string[];
  createdAt: string;
  updatedAt: string;
};

/** GET /wardrobes/{wardrobeId}/items */
export type ClothingItemList = {
  items: ClothingItem[];
};

export type OutfitItem = {
  itemId: string;
  slot: OutfitSlot;
};

export type Outfit = {
  outfitId: string;
  wardrobeId: string;
  name: string;
  items: OutfitItem[];
  render?: OutfitRender;
  renderHistory?: OutfitRenderHistoryEntry[];
  renderImageUrls?: string[];
  createdAt: string;
  updatedAt: string;
};

/** GET /wardrobes/{wardrobeId}/outfits — composed across wardrobes on the outfits page */
export type OutfitList = {
  outfits: Outfit[];
};

export type AiProfile = {
  aiProfileId: string;
  type: AiProfileType;
  referenceImages: string[];
  status: AiProfileStatus;
  createdAt: string;
  updatedAt: string;
  label?: string;
  notes?: string;
  mainImageKey?: string;
  frontImageUrl?: string;
  referenceImageUrls?: Record<string, string>;
  heightCm?: number;
  weightKg?: number;
  bustCm?: number;
  hipsCm?: number;
  clothingSize?: string;
  braSize?: string;
  ageYears?: number;
  bodyType?: string;
  gender?: string;
};

/** GET /ai-profiles and GET /ai-profiles/models */
export type AiProfileList = {
  aiProfiles: AiProfile[];
};

export type WardrobeDetail = {
  wardrobe: Wardrobe;
  items: ClothingItem[];
};
