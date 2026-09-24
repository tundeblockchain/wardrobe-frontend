export const appPaths = {
  home: "/",
  terms: "/terms",
  privacy: "/privacy",
  contact: "/contact",
  share: "/share/:token",
} as const;

export type AppPath = (typeof appPaths)[keyof typeof appPaths];

const SHARE_PATH_PATTERN = /^\/share\/([^/]+)$/;

export const getSharePath = (token: string): string => {
  return `/share/${token}`;
};

export const parseShareTokenFromPath = (
  pathname: string,
): string | undefined => {
  const normalizedPath =
    pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
  const match = normalizedPath.match(SHARE_PATH_PATTERN);
  if (!match?.[1]) {
    return undefined;
  }

  return match[1];
};

export const isSharePreviewPath = (pathname: string): boolean => {
  return parseShareTokenFromPath(pathname) !== undefined;
};
