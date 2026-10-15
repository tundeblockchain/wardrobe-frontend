import { getItemDisplayName, getItemImageUrl } from "./resourceDisplay";
import {
  CLOTHING_CATEGORIES,
  NAME_MAX_LENGTH,
  type ClothingItem,
  type CreateOutfitRequest,
  type OutfitRecommendation,
  type OutfitRecommendationItem,
  type OutfitRecommendationList,
  type OutfitSlot,
} from "./resourceTypes";

export const SUGGESTED_OUTFIT_STATE_KEY = "suggestedOutfit";
export const DEFAULT_SUGGESTED_OUTFIT_NAME = "Suggested look";
export const MAX_RECOMMENDATIONS = 8;
export const MAX_ITEMS_PER_SLOT = 6;

export type SuggestedOutfitItemView = {
  itemId: string;
  slot: OutfitSlot;
  name: string;
  imageUrl?: string;
};

export type SuggestedOutfitView = {
  recommendation: OutfitRecommendation;
  items: SuggestedOutfitItemView[];
};

export type SuggestedOutfitLocationState = {
  [SUGGESTED_OUTFIT_STATE_KEY]?: SuggestedOutfitView;
};

const isOutfitSlot = (value: unknown): value is OutfitSlot => {
  return (
    typeof value === "string" &&
    (CLOTHING_CATEGORIES as readonly string[]).includes(value)
  );
};

const limitItemsPerSlot = (
  items: OutfitRecommendationItem[],
): OutfitRecommendationItem[] => {
  const slotCounts = new Map<OutfitSlot, number>();

  return items.filter((item) => {
    const used = slotCounts.get(item.slot) ?? 0;
    if (used >= MAX_ITEMS_PER_SLOT) {
      return false;
    }

    slotCounts.set(item.slot, used + 1);
    return true;
  });
};

const readOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed;
};

export const parseOutfitRecommendationItem = (
  value: unknown,
): OutfitRecommendationItem | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const itemId = readOptionalString(raw.itemId);
  if (!itemId || !isOutfitSlot(raw.slot)) {
    return undefined;
  }

  const item: OutfitRecommendationItem = {
    itemId,
    slot: raw.slot,
  };
  const name = readOptionalString(raw.name);
  if (name) {
    item.name = name;
  }
  const imageUrl = readOptionalString(raw.imageUrl);
  if (imageUrl) {
    item.imageUrl = imageUrl;
  }
  const originalImageUrl = readOptionalString(raw.originalImageUrl);
  if (originalImageUrl) {
    item.originalImageUrl = originalImageUrl;
  }
  const processedImageUrl = readOptionalString(raw.processedImageUrl);
  if (processedImageUrl) {
    item.processedImageUrl = processedImageUrl;
  }

  return item;
};

export const parseOutfitRecommendation = (
  value: unknown,
): OutfitRecommendation | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.items)) {
    return undefined;
  }

  const items = limitItemsPerSlot(
    raw.items
      .map(parseOutfitRecommendationItem)
      .filter((item): item is OutfitRecommendationItem => Boolean(item)),
  );
  if (items.length === 0) {
    return undefined;
  }

  const recommendation: OutfitRecommendation = { items };
  const name = readOptionalString(raw.name);
  if (name) {
    recommendation.name = name;
  }
  const title = readOptionalString(raw.title);
  if (title) {
    recommendation.title = title;
  }
  const reason = readOptionalString(raw.reason);
  if (reason) {
    recommendation.reason = reason;
  }

  return recommendation;
};

export const parseOutfitRecommendations = (
  value: unknown,
): OutfitRecommendation[] => {
  if (Array.isArray(value)) {
    return value
      .map(parseOutfitRecommendation)
      .filter((entry): entry is OutfitRecommendation => Boolean(entry))
      .slice(0, MAX_RECOMMENDATIONS);
  }

  if (value && typeof value === "object") {
    const raw = value as { recommendations?: unknown };
    if (Array.isArray(raw.recommendations)) {
      return parseOutfitRecommendations(raw.recommendations);
    }
  }

  return [];
};

export const toOutfitRecommendationList = (
  value: unknown,
): OutfitRecommendationList => {
  return {
    recommendations: parseOutfitRecommendations(value),
  };
};

export const resolveOutfitSaveName = (name: string | undefined): string => {
  const trimmed = name?.trim() ?? "";
  if (trimmed.length === 0) {
    return DEFAULT_SUGGESTED_OUTFIT_NAME;
  }

  return trimmed.slice(0, NAME_MAX_LENGTH);
};

export const getRecommendationTitle = (
  recommendation: OutfitRecommendation,
): string => {
  return resolveOutfitSaveName(
    readOptionalString(recommendation.name) ??
      readOptionalString(recommendation.title),
  );
};

export const getRecommendationReason = (
  recommendation: OutfitRecommendation,
): string | undefined => {
  return readOptionalString(recommendation.reason);
};

export const resolveSuggestedOutfitItems = (
  recommendation: OutfitRecommendation,
  catalogItems: ClothingItem[],
): SuggestedOutfitItemView[] => {
  const catalogById = new Map(
    catalogItems.map((item) => [item.itemId, item] as const),
  );

  return recommendation.items.map((entry) => {
    const catalog = catalogById.get(entry.itemId);
    const name =
      readOptionalString(entry.name) ??
      (catalog ? getItemDisplayName(catalog) : undefined) ??
      "Item";
    const imageUrl =
      readOptionalString(entry.processedImageUrl) ??
      readOptionalString(entry.originalImageUrl) ??
      readOptionalString(entry.imageUrl) ??
      (catalog ? getItemImageUrl(catalog) : undefined);

    return {
      itemId: entry.itemId,
      slot: entry.slot,
      name,
      imageUrl,
    };
  });
};

export const toSuggestedOutfitView = (
  recommendation: OutfitRecommendation,
  catalogItems: ClothingItem[],
): SuggestedOutfitView => {
  return {
    recommendation,
    items: resolveSuggestedOutfitItems(recommendation, catalogItems),
  };
};

export const toCreateOutfitRequest = (
  recommendation: OutfitRecommendation,
  nameOverride?: string,
): CreateOutfitRequest => {
  return {
    name: resolveOutfitSaveName(
      nameOverride !== undefined
        ? nameOverride
        : getRecommendationTitle(recommendation),
    ),
    items: recommendation.items.map((item) => ({
      itemId: item.itemId,
      slot: item.slot,
    })),
  };
};

const parseSuggestedOutfitItemView = (
  value: unknown,
): SuggestedOutfitItemView | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const itemId = readOptionalString(raw.itemId);
  if (!itemId || !isOutfitSlot(raw.slot)) {
    return undefined;
  }

  return {
    itemId,
    slot: raw.slot,
    name: readOptionalString(raw.name) ?? "Item",
    imageUrl: readOptionalString(raw.imageUrl),
  };
};

export const readSuggestedOutfitState = (
  state: unknown,
): SuggestedOutfitView | undefined => {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    return undefined;
  }

  const raw = (state as SuggestedOutfitLocationState)[
    SUGGESTED_OUTFIT_STATE_KEY
  ];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }

  const recommendation = parseOutfitRecommendation(raw.recommendation);
  if (!recommendation) {
    return undefined;
  }

  if (!Array.isArray(raw.items)) {
    return {
      recommendation,
      items: resolveSuggestedOutfitItems(recommendation, []),
    };
  }

  const items = raw.items
    .map(parseSuggestedOutfitItemView)
    .filter((item): item is SuggestedOutfitItemView => Boolean(item));
  if (items.length === 0) {
    return undefined;
  }

  return {
    recommendation,
    items,
  };
};

export const toSuggestedOutfitLocationState = (
  view: SuggestedOutfitView,
): SuggestedOutfitLocationState => {
  return {
    [SUGGESTED_OUTFIT_STATE_KEY]: view,
  };
};
