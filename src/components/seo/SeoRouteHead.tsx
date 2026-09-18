import { useLocation } from "react-router-dom";
import { getPublicAppEnv } from "../../config/env";
import { getPageSeo } from "../../content/seo";
import { SeoHead } from "./SeoHead";

export const SeoRouteHead = () => {
  const { pathname } = useLocation();
  const env = getPublicAppEnv();
  const pageSeo = getPageSeo({
    pathname,
    env,
    siteOrigin: window.location.origin,
  });

  return <SeoHead pageSeo={pageSeo} />;
};
