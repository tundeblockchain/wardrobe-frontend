export const APP_BASE_PATH = "/app";

export const appPaths = {
  home: "/",
  terms: "/terms",
  privacy: "/privacy",
  contact: "/contact",
  pricing: "/pricing",
  share: "/share/:token",
  login: "/login",
  app: APP_BASE_PATH,
  appWardrobes: `${APP_BASE_PATH}/wardrobes`,
  appWardrobeNew: `${APP_BASE_PATH}/wardrobes/new`,
  appWardrobe: `${APP_BASE_PATH}/wardrobes/:id`,
  appWardrobeEdit: `${APP_BASE_PATH}/wardrobes/:id/edit`,
  appWardrobeItemNew: `${APP_BASE_PATH}/wardrobes/:id/items/new`,
  appWardrobeRecommendations: `${APP_BASE_PATH}/wardrobes/:id/recommendations`,
  appWardrobeRecommendationDetail: `${APP_BASE_PATH}/wardrobes/:id/recommendations/detail`,
  appItem: `${APP_BASE_PATH}/items/:id`,
  appItemEdit: `${APP_BASE_PATH}/items/:id/edit`,
  appOutfits: `${APP_BASE_PATH}/outfits`,
  appOutfitNew: `${APP_BASE_PATH}/outfits/new`,
  appOutfitEdit: `${APP_BASE_PATH}/outfits/:id/edit`,
  appVirtualProfiles: `${APP_BASE_PATH}/virtual-profiles`,
  appVirtualProfileNew: `${APP_BASE_PATH}/virtual-profiles/new`,
  appVirtualProfileEdit: `${APP_BASE_PATH}/virtual-profiles/:id/edit`,
  appVirtualTryOn: `${APP_BASE_PATH}/virtual-try-on`,
  appSettings: `${APP_BASE_PATH}/settings`,
  appPricing: `${APP_BASE_PATH}/pricing`,
  appPlan: `${APP_BASE_PATH}/settings#plan`,
  appSettingsPlan: `${APP_BASE_PATH}/settings#plan`,
  appBillingSuccess: `${APP_BASE_PATH}/billing/success`,
  appBillingCancel: `${APP_BASE_PATH}/billing/cancel`,
} as const;

export const SETTINGS_PLAN_HASH = "plan";

export const getAppSettingsPlanPath = (): string => {
  return `${appPaths.appSettings}#${SETTINGS_PLAN_HASH}`;
};

export const WARDROBE_ID_QUERY_PARAM = "wardrobeId";
export const VIRTUAL_TRY_ON_ITEM_QUERY_PARAM = "itemId";
export const VIRTUAL_TRY_ON_OUTFIT_QUERY_PARAM = "outfitId";

export type VirtualTryOnPathSelection = {
  wardrobeId?: string;
  itemId?: string;
  outfitId?: string;
};

export type AppPath = (typeof appPaths)[keyof typeof appPaths];

export const LOGIN_NEXT_QUERY_PARAM = "next";
export const LOGIN_MODE_QUERY_PARAM = "mode";
export const LOGIN_SIGNUP_MODE = "signup";
export const CONTACT_TYPE_QUERY_PARAM = "type";
export const CONTACT_BUG_TYPE = "bug";
export const CONTACT_BUG_SUBJECT = "Report a bug";

const SHARE_PATH_PATTERN = /^\/share\/([^/]+)$/;

const stripTrailingSlash = (pathname: string): string => {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "");
};

export const getSharePath = (token: string): string => {
  return `/share/${token}`;
};

export const parseShareTokenFromPath = (
  pathname: string,
): string | undefined => {
  const normalizedPath = stripTrailingSlash(pathname);
  const match = normalizedPath.match(SHARE_PATH_PATTERN);
  if (!match?.[1]) {
    return undefined;
  }

  return match[1];
};

export const isSharePreviewPath = (pathname: string): boolean => {
  return parseShareTokenFromPath(pathname) !== undefined;
};

export const getAppWardrobePath = (wardrobeId: string): string => {
  return `${appPaths.appWardrobes}/${encodeURIComponent(wardrobeId)}`;
};

export const getAppWardrobeEditPath = (wardrobeId: string): string => {
  return `${getAppWardrobePath(wardrobeId)}/edit`;
};

export const getAppItemNewPath = (wardrobeId: string): string => {
  return `${getAppWardrobePath(wardrobeId)}/items/new`;
};

export const getAppWardrobeRecommendationsPath = (
  wardrobeId: string,
): string => {
  return `${getAppWardrobePath(wardrobeId)}/recommendations`;
};

export const getAppWardrobeRecommendationDetailPath = (
  wardrobeId: string,
): string => {
  return `${getAppWardrobeRecommendationsPath(wardrobeId)}/detail`;
};

const withWardrobeIdQuery = (path: string, wardrobeId?: string): string => {
  const trimmedWardrobeId = wardrobeId?.trim();
  if (!trimmedWardrobeId) {
    return path;
  }

  const searchParams = new URLSearchParams({
    [WARDROBE_ID_QUERY_PARAM]: trimmedWardrobeId,
  });
  return `${path}?${searchParams.toString()}`;
};

export const getAppItemPath = (
  itemId: string,
  wardrobeId?: string,
): string => {
  return withWardrobeIdQuery(
    `${APP_BASE_PATH}/items/${encodeURIComponent(itemId)}`,
    wardrobeId,
  );
};

export const getAppItemEditPath = (
  itemId: string,
  wardrobeId?: string,
): string => {
  return withWardrobeIdQuery(
    `${APP_BASE_PATH}/items/${encodeURIComponent(itemId)}/edit`,
    wardrobeId,
  );
};

export const getAppOutfitNewPath = (wardrobeId?: string): string => {
  return withWardrobeIdQuery(appPaths.appOutfitNew, wardrobeId);
};

export const getAppOutfitEditPath = (
  outfitId: string,
  wardrobeId?: string,
): string => {
  return withWardrobeIdQuery(
    `${appPaths.appOutfits}/${encodeURIComponent(outfitId)}/edit`,
    wardrobeId,
  );
};

export const getAppVirtualProfileEditPath = (aiProfileId: string): string => {
  return `${appPaths.appVirtualProfiles}/${encodeURIComponent(aiProfileId)}/edit`;
};

export const getAppVirtualTryOnPath = (
  selection: VirtualTryOnPathSelection = {},
): string => {
  const searchParams = new URLSearchParams();
  const wardrobeId = selection.wardrobeId?.trim();
  const itemId = selection.itemId?.trim();
  const outfitId = selection.outfitId?.trim();

  if (wardrobeId) {
    searchParams.set(WARDROBE_ID_QUERY_PARAM, wardrobeId);
  }
  if (itemId) {
    searchParams.set(VIRTUAL_TRY_ON_ITEM_QUERY_PARAM, itemId);
  }
  if (outfitId) {
    searchParams.set(VIRTUAL_TRY_ON_OUTFIT_QUERY_PARAM, outfitId);
  }

  const query = searchParams.toString();
  return query ? `${appPaths.appVirtualTryOn}?${query}` : appPaths.appVirtualTryOn;
};

export const getAppPath = (subPath = ""): string => {
  const trimmedSubPath = subPath.trim();
  if (trimmedSubPath === "" || trimmedSubPath === "/") {
    return appPaths.app;
  }

  const withLeadingSlash = trimmedSubPath.startsWith("/")
    ? trimmedSubPath
    : `/${trimmedSubPath}`;
  const normalizedSubPath = stripTrailingSlash(withLeadingSlash);

  return `${appPaths.app}${normalizedSubPath}`;
};

export const isAppPath = (pathname: string): boolean => {
  const normalizedPath = stripTrailingSlash(pathname);
  return (
    normalizedPath === appPaths.app ||
    normalizedPath.startsWith(`${appPaths.app}/`)
  );
};

export const getPricingPath = (pathname = ""): string => {
  return isAppPath(pathname) ? appPaths.appPricing : appPaths.pricing;
};

export const getContactPath = (type?: string): string => {
  if (type !== CONTACT_BUG_TYPE) {
    return appPaths.contact;
  }

  const searchParams = new URLSearchParams({
    [CONTACT_TYPE_QUERY_PARAM]: CONTACT_BUG_TYPE,
  });
  return `${appPaths.contact}?${searchParams.toString()}`;
};

export const isContactBugType = (
  type: string | null | undefined,
): boolean => {
  return type === CONTACT_BUG_TYPE;
};

export const getLoginPath = (nextPath?: string, mode?: string): string => {
  const searchParams = new URLSearchParams();
  if (nextPath) {
    searchParams.set(LOGIN_NEXT_QUERY_PARAM, nextPath);
  }
  if (mode) {
    searchParams.set(LOGIN_MODE_QUERY_PARAM, mode);
  }

  const query = searchParams.toString();
  return query ? `${appPaths.login}?${query}` : appPaths.login;
};

export const getLoginSignupPath = (nextPath?: string): string => {
  return getLoginPath(nextPath, LOGIN_SIGNUP_MODE);
};

export const isLoginSignupMode = (
  mode: string | null | undefined,
): boolean => {
  return mode === LOGIN_SIGNUP_MODE;
};

export const getSafeInternalPath = (
  value: string | null | undefined,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return undefined;
  }

  return value;
};

const getPathnameFromInternalPath = (value: string): string => {
  const pathname = value.split(/[?#]/, 1)[0] ?? value;
  return stripTrailingSlash(pathname);
};

export const getPostLoginRedirectPath = (
  nextParam?: string | null,
  fromPath?: string | null,
): string => {
  const candidates = [nextParam, fromPath];
  for (const candidate of candidates) {
    const safePath = getSafeInternalPath(candidate);
    if (!safePath) {
      continue;
    }

    if (getPathnameFromInternalPath(safePath) === appPaths.login) {
      continue;
    }

    return safePath;
  }

  return appPaths.app;
};
