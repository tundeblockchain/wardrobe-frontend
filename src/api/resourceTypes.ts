/**
 * Authenticated catalog DTOs from the WARDROBE-173 contract
 * (wardrobe-backend#71). Keep this module as the single place for field names
 * and wrappers.
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

/** GET /outfits and GET /wardrobes/{wardrobeId}/outfits */
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

/** GET /ai-profiles */
export type AiProfileList = {
  aiProfiles: AiProfile[];
};

export type WardrobeDetail = {
  wardrobe: Wardrobe;
  items: ClothingItem[];
};

export const SUBSCRIPTION_TIERS = ["FREE", "BASIC", "PREMIUM"] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export const ENTITLEMENT_STATUSES = [
  "NONE",
  "ACTIVE",
  "CANCELED",
  "BILLING_ISSUE",
  "PAUSED",
  "EXPIRED",
] as const;
export type EntitlementStatus = (typeof ENTITLEMENT_STATUSES)[number];

export const ENTITLEMENT_STORES = [
  "APP_STORE",
  "PLAY_STORE",
  "STRIPE",
  "UNKNOWN",
] as const;
export type EntitlementStore = (typeof ENTITLEMENT_STORES)[number];

export const ENTITLEMENT_PERIODS = ["MONTHLY", "YEARLY", "UNKNOWN"] as const;
export type EntitlementPeriod = (typeof ENTITLEMENT_PERIODS)[number];

export type EntitlementFeatures = {
  unlimitedCatalog: boolean;
  aiTryOn: boolean;
  otherAi: boolean;
};

export type EntitlementLimits = {
  wardrobes: number;
  items: number;
  outfits: number;
};

export type EntitlementUsage = {
  wardrobes: number;
  items: number;
  outfits: number;
};

/** GET /me */
export type Entitlement = {
  userId: string;
  tier: SubscriptionTier;
  status: EntitlementStatus;
  features: EntitlementFeatures;
  limits: EntitlementLimits | null;
  usage: EntitlementUsage;
  productId?: string;
  store?: EntitlementStore;
  period?: EntitlementPeriod;
  expiresAt?: string;
  updatedAt: string;
};

export const ENTITLEMENT_AI_REQUIRED_CODE = "ENTITLEMENT_AI_REQUIRED";
export const ENTITLEMENT_WARDROBE_LIMIT_CODE = "ENTITLEMENT_WARDROBE_LIMIT";
export const ENTITLEMENT_ITEM_LIMIT_CODE = "ENTITLEMENT_ITEM_LIMIT";
export const ENTITLEMENT_OUTFIT_LIMIT_CODE = "ENTITLEMENT_OUTFIT_LIMIT";

export const CATALOG_LIMIT_CODES = [
  ENTITLEMENT_WARDROBE_LIMIT_CODE,
  ENTITLEMENT_ITEM_LIMIT_CODE,
  ENTITLEMENT_OUTFIT_LIMIT_CODE,
] as const;

export type CatalogLimitCode = (typeof CATALOG_LIMIT_CODES)[number];
export type CatalogKind = "wardrobe" | "item" | "outfit";

export const UPLOAD_PURPOSE_WARDROBE_ITEM = "WARDROBE_ITEM";
export type UploadPurpose = typeof UPLOAD_PURPOSE_WARDROBE_ITEM;

export const ALLOWED_UPLOAD_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

export type AllowedUploadContentType =
  (typeof ALLOWED_UPLOAD_CONTENT_TYPES)[number];

/** Matches wardrobe-backend MAX_UPLOAD_BYTES (10 MiB). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const NAME_MAX_LENGTH = 100;
export const COLOUR_MAX_LENGTH = 40;

/** POST /wardrobes */
export type CreateWardrobeRequest = {
  name: string;
};

/** PATCH /wardrobes/{wardrobeId} */
export type UpdateWardrobeRequest = {
  name: string;
};

/** POST /wardrobes/{wardrobeId}/items */
export type CreateItemRequest = {
  name: string;
  category: ClothingCategory;
  subcategory?: string;
  colours?: string[];
  brand?: string;
  acquiredAt?: string;
  imageKey: string;
};

/** PATCH /wardrobes/{wardrobeId}/items/{itemId} */
export type UpdateItemRequest = {
  name?: string;
  category?: ClothingCategory;
  subcategory?: string | null;
  colours?: string[];
  brand?: string;
  acquiredAt?: string | null;
  imageKey?: string;
};

/** POST /wardrobes/{wardrobeId}/outfits */
export type CreateOutfitRequest = {
  name: string;
  items: OutfitItem[];
};

/** PATCH /wardrobes/{wardrobeId}/outfits/{outfitId} */
export type UpdateOutfitRequest = {
  name?: string;
  items?: OutfitItem[];
};

/** POST /uploads */
export type CreateUploadRequest = {
  contentType: string;
  purpose: UploadPurpose;
  contentLength?: number;
};

export type CreateUploadResponse = {
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
};
