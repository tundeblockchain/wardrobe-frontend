export const APP_BASE_PATH = "/app";

export const appPaths = {
  home: "/",
  terms: "/terms",
  privacy: "/privacy",
  contact: "/contact",
  share: "/share/:token",
  login: "/login",
  app: APP_BASE_PATH,
} as const;

export type AppPath = (typeof appPaths)[keyof typeof appPaths];

export const LOGIN_NEXT_QUERY_PARAM = "next";

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

export const getLoginPath = (nextPath?: string): string => {
  if (!nextPath) {
    return appPaths.login;
  }

  const searchParams = new URLSearchParams();
  searchParams.set(LOGIN_NEXT_QUERY_PARAM, nextPath);
  return `${appPaths.login}?${searchParams.toString()}`;
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
