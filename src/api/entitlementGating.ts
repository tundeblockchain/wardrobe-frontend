import { isCatalogLimitError } from "./catalogLimits";
import { ApiError, isApiError } from "./httpClient";
import {
  CATALOG_LIMIT_CODES,
  ENTITLEMENT_AI_REQUIRED_CODE,
  ENTITLEMENT_ITEM_LIMIT_CODE,
  ENTITLEMENT_OUTFIT_LIMIT_CODE,
  ENTITLEMENT_WARDROBE_LIMIT_CODE,
  type CatalogKind,
  type Entitlement,
} from "./resourceTypes";

export type ForbiddenUpgradeKind = "basic" | "premium";

export const canUseAiTryOn = (entitlement: Entitlement): boolean => {
  return entitlement.features.aiTryOn;
};

export const canUseOtherAi = (entitlement: Entitlement): boolean => {
  return entitlement.features.otherAi;
};

export const canUseOutfitSuggestions = (entitlement: Entitlement): boolean => {
  if (entitlement.features.unlimitedCatalog) {
    return true;
  }

  return entitlement.tier === "BASIC" || entitlement.tier === "PREMIUM";
};

export const isEntitlementAiRequiredError = (
  error: unknown,
): error is ApiError => {
  return (
    isApiError(error) &&
    error.status === 403 &&
    error.code === ENTITLEMENT_AI_REQUIRED_CODE
  );
};

export const isForbiddenStatusError = (error: unknown): error is ApiError => {
  return isApiError(error) && error.status === 403;
};

export const getForbiddenUpgradeKind = (
  error: unknown,
): ForbiddenUpgradeKind | undefined => {
  if (isEntitlementAiRequiredError(error)) {
    return "premium";
  }

  if (isCatalogLimitError(error)) {
    return "basic";
  }

  return undefined;
};

export const getRecommendationsPaywallKind = (
  error: unknown,
): ForbiddenUpgradeKind | undefined => {
  if (!isForbiddenStatusError(error)) {
    return undefined;
  }

  return "basic";
};

export const getCatalogKindForLimitCode = (
  code: string | undefined,
): CatalogKind | undefined => {
  if (code === ENTITLEMENT_WARDROBE_LIMIT_CODE) {
    return "wardrobe";
  }
  if (code === ENTITLEMENT_ITEM_LIMIT_CODE) {
    return "item";
  }
  if (code === ENTITLEMENT_OUTFIT_LIMIT_CODE) {
    return "outfit";
  }

  return undefined;
};

export const isCatalogLimitCode = (code: string | undefined): boolean => {
  if (!code) {
    return false;
  }

  return (CATALOG_LIMIT_CODES as readonly string[]).includes(code);
};
