import { getCatalogLimitErrorMessage } from "../content/catalogLimitCopy";
import { ApiError, isApiError } from "./httpClient";
import {
  CATALOG_LIMIT_CODES,
  ENTITLEMENT_ITEM_LIMIT_CODE,
  ENTITLEMENT_OUTFIT_LIMIT_CODE,
  ENTITLEMENT_WARDROBE_LIMIT_CODE,
  type CatalogKind,
  type CatalogLimitCode,
  type Entitlement,
  type EntitlementLimits,
} from "./resourceTypes";

const USAGE_KEY_BY_KIND: Record<
  CatalogKind,
  keyof Entitlement["usage"]
> = {
  wardrobe: "wardrobes",
  item: "items",
  outfit: "outfits",
};

const LIMIT_CODE_BY_KIND: Record<CatalogKind, CatalogLimitCode> = {
  wardrobe: ENTITLEMENT_WARDROBE_LIMIT_CODE,
  item: ENTITLEMENT_ITEM_LIMIT_CODE,
  outfit: ENTITLEMENT_OUTFIT_LIMIT_CODE,
};

export const getCatalogUsageKey = (
  kind: CatalogKind,
): keyof Entitlement["usage"] => {
  return USAGE_KEY_BY_KIND[kind];
};

export const getCatalogLimitCode = (kind: CatalogKind): CatalogLimitCode => {
  return LIMIT_CODE_BY_KIND[kind];
};

export const isAtCatalogLimit = (
  entitlement: Entitlement,
  kind: CatalogKind,
): boolean => {
  if (entitlement.features.unlimitedCatalog) {
    return false;
  }

  const limits = entitlement.limits;
  if (!limits) {
    return false;
  }

  const usageKey = getCatalogUsageKey(kind);
  return entitlement.usage[usageKey] >= limits[usageKey];
};

export const isCatalogLimitError = (error: unknown): error is ApiError => {
  if (!isApiError(error) || error.status !== 403) {
    return false;
  }

  if (!error.code) {
    return false;
  }

  return (CATALOG_LIMIT_CODES as readonly string[]).includes(error.code);
};

export const catalogLimitError = (
  kind: CatalogKind,
  limits?: EntitlementLimits | null,
): ApiError => {
  return new ApiError({
    status: 403,
    code: getCatalogLimitCode(kind),
    message: getCatalogLimitErrorMessage(kind, limits),
  });
};
