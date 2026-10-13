import type {
  CatalogKind,
  EntitlementLimits,
  EntitlementUsage,
} from "../api/resourceTypes";
import { dashboardCopy } from "./dashboardCopy";

const CATALOG_LIMIT_NOUNS: Record<
  CatalogKind,
  { singular: string; plural: string }
> = {
  wardrobe: { singular: "wardrobe", plural: "wardrobes" },
  item: { singular: "clothing item", plural: "clothing items" },
  outfit: { singular: "outfit", plural: "outfits" },
};

const USAGE_KEY_BY_KIND: Record<
  CatalogKind,
  keyof EntitlementLimits
> = {
  wardrobe: "wardrobes",
  item: "items",
  outfit: "outfits",
};

export type CatalogLimitCopyContext = {
  limits?: EntitlementLimits | null;
  usage?: EntitlementUsage;
};

const getCatalogLimitNoun = (kind: CatalogKind, count: number): string => {
  const nouns = CATALOG_LIMIT_NOUNS[kind];
  return count === 1 ? nouns.singular : nouns.plural;
};

const getCatalogLimitValue = (
  kind: CatalogKind,
  limits?: EntitlementLimits | null,
): number | undefined => {
  if (!limits) {
    return undefined;
  }

  return limits[USAGE_KEY_BY_KIND[kind]];
};

export const getCatalogLimitDescription = (
  kind: CatalogKind,
  context: CatalogLimitCopyContext = {},
): string => {
  const limit = getCatalogLimitValue(kind, context.limits);
  if (typeof limit !== "number") {
    return dashboardCopy.catalogLimit[kind].description;
  }

  const noun = getCatalogLimitNoun(kind, limit);
  const used = context.usage?.[USAGE_KEY_BY_KIND[kind]];
  if (typeof used === "number") {
    return `You've used ${used} of ${limit} ${noun}. Upgrade your plan to add another.`;
  }

  return `The Free plan includes ${limit} ${noun}. Upgrade your plan to add another.`;
};

export const getCatalogLimitErrorMessage = (
  kind: CatalogKind,
  limits?: EntitlementLimits | null,
): string => {
  const limit = getCatalogLimitValue(kind, limits);
  if (typeof limit !== "number") {
    return `Free plan ${CATALOG_LIMIT_NOUNS[kind].singular} limit reached. Upgrade to add more.`;
  }

  return `Free plan allows ${limit} ${getCatalogLimitNoun(kind, limit)}. Upgrade to add more.`;
};
