export const APP_BASE_PATH = "/app";

export const appPaths = {
  home: "/",
  terms: "/terms",
  privacy: "/privacy",
  contact: "/contact",
  share: "/share/:token",
  login: "/login",
  app: APP_BASE_PATH,
  appWardrobes: `${APP_BASE_PATH}/wardrobes`,
  appWardrobe: `${APP_BASE_PATH}/wardrobes/:id`,
  appItem: `${APP_BASE_PATH}/items/:id`,
  appOutfits: `${APP_BASE_PATH}/outfits`,
  appVirtualProfiles: `${APP_BASE_PATH}/virtual-profiles`,
  appPlan: `${APP_BASE_PATH}/plan`,
} as const;

export const WARDROBE_ID_QUERY_PARAM = "wardrobeId";

export type AppPath = (typeof appPaths)[keyof typeof appPaths];

export const LOGIN_NEXT_QUERY_PARAM = "next";
export const LOGIN_MODE_QUERY_PARAM = "mode";
export const LOGIN_SIGNUP_MODE = "signup";

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

export const getAppItemPath = (
  itemId: string,
  wardrobeId?: string,
): string => {
  const path = `${APP_BASE_PATH}/items/${encodeURIComponent(itemId)}`;
  const trimmedWardrobeId = wardrobeId?.trim();
  if (!trimmedWardrobeId) {
    return path;
  }

  const searchParams = new URLSearchParams({
    [WARDROBE_ID_QUERY_PARAM]: trimmedWardrobeId,
  });
  return `${path}?${searchParams.toString()}`;
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
