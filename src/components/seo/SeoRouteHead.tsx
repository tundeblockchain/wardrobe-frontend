import { useLocation } from "react-router-dom";
import { getPublicAppEnv } from "../../config/env";
import { getPageSeo } from "../../content/seo";
import { isSharePreviewPath } from "../../routes/paths";
import { SeoHead } from "./SeoHead";

export const SeoRouteHead = () => {
  const { pathname } = useLocation();
  const env = getPublicAppEnv();

  if (isSharePreviewPath(pathname)) {
    return null;
  }

  const pageSeo = getPageSeo({
    pathname,
    env,
    siteOrigin: window.location.origin,
  });

  return <SeoHead pageSeo={pageSeo} />;
};
