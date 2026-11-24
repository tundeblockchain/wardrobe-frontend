import {
  appPaths,
  isAdminPath,
  isAppPath,
  isSharePreviewPath,
} from "../routes/paths";

export const PUBLIC_SITEMAP_PATHS = [
  appPaths.home,
  appPaths.terms,
  appPaths.privacy,
  appPaths.contact,
  appPaths.pricing,
] as const;

export const isExcludedFromSitemap = (pathname: string): boolean => {
  return (
    isAdminPath(pathname) ||
    isAppPath(pathname) ||
    isSharePreviewPath(pathname) ||
    pathname === appPaths.login
  );
};
