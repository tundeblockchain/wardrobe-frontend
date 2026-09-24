import type { SharePreview, SharePreviewErrorKind } from "../api/sharePreview";
import { getShareResourceTypeLabel } from "../api/sharePreview";
import type { PublicAppEnv } from "../config/env";
import { appPaths, parseShareTokenFromPath } from "../routes/paths";
import { wardrobePalette } from "../theme/wardrobePalette";
import { featureItems } from "./featureItems";
import { LEGAL_LAST_UPDATED_ISO } from "./legal/legalDocument";
import { getSharePreviewStatusCopy } from "./sharePreviewCopy";

export const OG_IMAGE_PATH = "/og-image.jpg";
export const JSON_LD_SCRIPT_ID = "wardrobe-json-ld";

export const DEFAULT_LANDING_TITLE =
  "Pocket Closet — organize, outfit, and try on your closet";
export const DEFAULT_LANDING_DESCRIPTION =
  "Pocket Closet is a wardrobe companion for iOS and Android. Photograph pieces, catalog your closet, compose outfits, and preview looks with try-on.";

export type JsonLd = Record<string, unknown>;

export type DocumentMetaTag = {
  key: string;
  name?: string;
  property?: string;
  content: string;
};

export type PageSeo = {
  title: string;
  description: string;
  path: string;
  siteName: string;
  canonicalUrl: string | undefined;
  ogType: "website";
  ogImageUrl: string | undefined;
  ogImageAlt: string;
  robots: string;
  jsonLd: JsonLd;
};

export type PageSeoInput = {
  pathname: string;
  env: PublicAppEnv;
  siteOrigin?: string;
  sharePreview?: SharePreview;
  shareErrorKind?: SharePreviewErrorKind;
};

const stripTrailingSlash = (value: string): string => {
  if (value === "/") {
    return value;
  }

  return value.replace(/\/+$/, "");
};

export const resolvePublicSiteUrl = (
  publicSiteUrl: string | undefined,
  siteOrigin?: string,
): string | undefined => {
  const configured = publicSiteUrl ?? siteOrigin;
  if (!configured) {
    return undefined;
  }

  return stripTrailingSlash(configured.trim());
};

export const toAbsoluteUrl = (
  siteUrl: string | undefined,
  path: string,
): string | undefined => {
  if (!siteUrl) {
    return undefined;
  }

  if (path === "/") {
    return `${siteUrl}/`;
  }

  return `${siteUrl}${path}`;
};

export const getLandingTitle = (appName: string): string => {
  return `${appName} — organize, outfit, and try on your closet`;
};

export const getLandingDescription = (appName: string): string => {
  return `${appName} is a wardrobe companion for iOS and Android. Photograph pieces, catalog your closet, compose outfits, and preview looks with try-on.`;
};

export const getTermsTitle = (appName: string): string => {
  return `Terms of Service — ${appName}`;
};

export const getTermsDescription = (appName: string): string => {
  return `Terms of Service for ${appName} websites, iOS and Android apps, and related services.`;
};

export const getPrivacyTitle = (appName: string): string => {
  return `Privacy Policy — ${appName}`;
};

export const getPrivacyDescription = (appName: string): string => {
  return `Privacy Policy for ${appName}, covering wardrobe photos, try-on previews, accounts, and optional website analytics.`;
};

export const getContactTitle = (appName: string): string => {
  return `Contact us — ${appName}`;
};

export const getContactDescription = (appName: string): string => {
  return `Contact the ${appName} operator with product questions or support requests.`;
};

export const getShareFallbackTitle = (appName: string): string => {
  return `Shared look — ${appName}`;
};

export const getShareFallbackDescription = (appName: string): string => {
  return `A shared wardrobe look from ${appName}. Open the app to save items, compose outfits, and try looks on.`;
};

export const getSharePreviewTitle = (
  preview: SharePreview,
  appName: string,
): string => {
  return `${preview.title} — ${appName}`;
};

export const getSharePreviewDescription = (
  preview: SharePreview,
  appName: string,
): string => {
  const typeLabel = getShareResourceTypeLabel(preview.resourceType).toLowerCase();
  return `A shared ${typeLabel} from ${appName}: ${preview.title}. Download the app to build your own wardrobe.`;
};

export const getShareErrorTitle = (
  errorKind: SharePreviewErrorKind,
  appName: string,
): string => {
  return `${getSharePreviewStatusCopy(errorKind).title} — ${appName}`;
};

const getSoftwareApplicationJsonLd = ({
  appName,
  description,
  url,
  appStoreUrl,
  playStoreUrl,
}: {
  appName: string;
  description: string;
  url: string | undefined;
  appStoreUrl: string | undefined;
  playStoreUrl: string | undefined;
}): JsonLd => {
  const jsonLd: JsonLd = {
    "@type": "SoftwareApplication",
    name: appName,
    description,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "iOS, Android",
    featureList: featureItems.map((featureItem) => featureItem.title),
  };

  if (url) {
    jsonLd.url = url;
  }

  const installUrls = [appStoreUrl, playStoreUrl].filter(
    (installUrl): installUrl is string => Boolean(installUrl),
  );
  if (installUrls.length === 1) {
    jsonLd.installUrl = installUrls[0];
  } else if (installUrls.length > 1) {
    jsonLd.installUrl = installUrls;
  }

  return jsonLd;
};

const getWebSiteJsonLd = ({
  appName,
  description,
  url,
}: {
  appName: string;
  description: string;
  url: string | undefined;
}): JsonLd => {
  const jsonLd: JsonLd = {
    "@type": "WebSite",
    name: appName,
    description,
  };

  if (url) {
    jsonLd.url = url;
    jsonLd["@id"] = `${url}#website`;
  }

  return jsonLd;
};

const getLandingJsonLd = ({
  appName,
  description,
  url,
  appStoreUrl,
  playStoreUrl,
}: {
  appName: string;
  description: string;
  url: string | undefined;
  appStoreUrl: string | undefined;
  playStoreUrl: string | undefined;
}): JsonLd => {
  return {
    "@context": "https://schema.org",
    "@graph": [
      getWebSiteJsonLd({ appName, description, url }),
      getSoftwareApplicationJsonLd({
        appName,
        description,
        url,
        appStoreUrl,
        playStoreUrl,
      }),
    ],
  };
};

const getWebPageJsonLd = ({
  name,
  description,
  url,
  siteName,
  siteUrl,
  dateModified,
}: {
  name: string;
  description: string;
  url: string | undefined;
  siteName: string;
  siteUrl: string | undefined;
  dateModified?: string;
}): JsonLd => {
  const jsonLd: JsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    inLanguage: "en",
  };

  if (dateModified) {
    jsonLd.dateModified = dateModified;
  }

  if (url) {
    jsonLd.url = url;
  }

  const isPartOf: JsonLd = {
    "@type": "WebSite",
    name: siteName,
  };
  if (siteUrl) {
    isPartOf.url = `${siteUrl}/`;
  }
  jsonLd.isPartOf = isPartOf;

  return jsonLd;
};

const getLegalPageJsonLd = ({
  name,
  description,
  url,
  siteName,
  siteUrl,
}: {
  name: string;
  description: string;
  url: string | undefined;
  siteName: string;
  siteUrl: string | undefined;
}): JsonLd => {
  return getWebPageJsonLd({
    name,
    description,
    url,
    siteName,
    siteUrl,
    dateModified: LEGAL_LAST_UPDATED_ISO,
  });
};

const getSharePageJsonLd = ({
  name,
  description,
  url,
  siteName,
  siteUrl,
  imageUrl,
}: {
  name: string;
  description: string;
  url: string | undefined;
  siteName: string;
  siteUrl: string | undefined;
  imageUrl: string | undefined;
}): JsonLd => {
  const jsonLd: JsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    inLanguage: "en",
  };

  if (url) {
    jsonLd.url = url;
  }

  if (imageUrl) {
    jsonLd.primaryImageOfPage = {
      "@type": "ImageObject",
      url: imageUrl,
    };
  }

  const isPartOf: JsonLd = {
    "@type": "WebSite",
    name: siteName,
  };
  if (siteUrl) {
    isPartOf.url = `${siteUrl}/`;
  }
  jsonLd.isPartOf = isPartOf;

  return jsonLd;
};

export const getPageSeo = ({
  pathname,
  env,
  siteOrigin,
  sharePreview,
  shareErrorKind,
}: PageSeoInput): PageSeo => {
  const siteUrl = resolvePublicSiteUrl(env.publicSiteUrl, siteOrigin);
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const canonicalUrl = toAbsoluteUrl(siteUrl, path);
  const defaultOgImageUrl = toAbsoluteUrl(siteUrl, OG_IMAGE_PATH);
  const ogImageUrl = defaultOgImageUrl;
  const ogImageAlt = `${env.appName} — organize, outfit, and try on your closet`;

  const shareToken = parseShareTokenFromPath(path);
  if (shareToken) {
    const sharePath = path;
    const shareCanonicalUrl = toAbsoluteUrl(siteUrl, sharePath);

    if (sharePreview) {
      const title = getSharePreviewTitle(sharePreview, env.appName);
      const description = getSharePreviewDescription(sharePreview, env.appName);
      const previewImageUrl = sharePreview.imageUrl ?? defaultOgImageUrl;

      return {
        title,
        description,
        path: sharePath,
        siteName: env.appName,
        canonicalUrl: shareCanonicalUrl,
        ogType: "website",
        ogImageUrl: previewImageUrl,
        ogImageAlt: sharePreview.title,
        robots: "index,follow",
        jsonLd: getSharePageJsonLd({
          name: title,
          description,
          url: shareCanonicalUrl,
          siteName: env.appName,
          siteUrl,
          imageUrl: previewImageUrl,
        }),
      };
    }

    if (shareErrorKind) {
      const statusCopy = getSharePreviewStatusCopy(shareErrorKind);
      const title = getShareErrorTitle(shareErrorKind, env.appName);

      return {
        title,
        description: statusCopy.description,
        path: sharePath,
        siteName: env.appName,
        canonicalUrl: shareCanonicalUrl,
        ogType: "website",
        ogImageUrl: defaultOgImageUrl,
        ogImageAlt,
        robots: "noindex,follow",
        jsonLd: getSharePageJsonLd({
          name: title,
          description: statusCopy.description,
          url: shareCanonicalUrl,
          siteName: env.appName,
          siteUrl,
          imageUrl: defaultOgImageUrl,
        }),
      };
    }

    const title = getShareFallbackTitle(env.appName);
    const description = getShareFallbackDescription(env.appName);

    return {
      title,
      description,
      path: sharePath,
      siteName: env.appName,
      canonicalUrl: shareCanonicalUrl,
      ogType: "website",
      ogImageUrl: defaultOgImageUrl,
      ogImageAlt,
      robots: "noindex,follow",
      jsonLd: getSharePageJsonLd({
        name: title,
        description,
        url: shareCanonicalUrl,
        siteName: env.appName,
        siteUrl,
        imageUrl: defaultOgImageUrl,
      }),
    };
  }

  if (path === appPaths.terms) {
    const title = getTermsTitle(env.appName);
    const description = getTermsDescription(env.appName);

    return {
      title,
      description,
      path,
      siteName: env.appName,
      canonicalUrl,
      ogType: "website",
      ogImageUrl,
      ogImageAlt,
      robots: "index,follow",
      jsonLd: getLegalPageJsonLd({
        name: title,
        description,
        url: canonicalUrl,
        siteName: env.appName,
        siteUrl,
      }),
    };
  }

  if (path === appPaths.privacy) {
    const title = getPrivacyTitle(env.appName);
    const description = getPrivacyDescription(env.appName);

    return {
      title,
      description,
      path,
      siteName: env.appName,
      canonicalUrl,
      ogType: "website",
      ogImageUrl,
      ogImageAlt,
      robots: "index,follow",
      jsonLd: getLegalPageJsonLd({
        name: title,
        description,
        url: canonicalUrl,
        siteName: env.appName,
        siteUrl,
      }),
    };
  }

  if (path === appPaths.contact) {
    const title = getContactTitle(env.appName);
    const description = getContactDescription(env.appName);

    return {
      title,
      description,
      path,
      siteName: env.appName,
      canonicalUrl,
      ogType: "website",
      ogImageUrl,
      ogImageAlt,
      robots: "index,follow",
      jsonLd: getWebPageJsonLd({
        name: title,
        description,
        url: canonicalUrl,
        siteName: env.appName,
        siteUrl,
      }),
    };
  }

  const title = getLandingTitle(env.appName);
  const description = getLandingDescription(env.appName);
  const landingUrl = toAbsoluteUrl(siteUrl, appPaths.home);

  return {
    title,
    description,
    path: appPaths.home,
    siteName: env.appName,
    canonicalUrl: landingUrl,
    ogType: "website",
    ogImageUrl,
    ogImageAlt,
    robots: "index,follow",
    jsonLd: getLandingJsonLd({
      appName: env.appName,
      description,
      url: landingUrl,
      appStoreUrl: env.appStoreUrl,
      playStoreUrl: env.playStoreUrl,
    }),
  };
};

export const getDocumentMetaTags = (pageSeo: PageSeo): DocumentMetaTag[] => {
  const tags: DocumentMetaTag[] = [
    {
      key: "description",
      name: "description",
      content: pageSeo.description,
    },
    {
      key: "robots",
      name: "robots",
      content: pageSeo.robots,
    },
    {
      key: "theme-color",
      name: "theme-color",
      content: wardrobePalette.themeColor,
    },
    {
      key: "og:title",
      property: "og:title",
      content: pageSeo.title,
    },
    {
      key: "og:description",
      property: "og:description",
      content: pageSeo.description,
    },
    {
      key: "og:type",
      property: "og:type",
      content: pageSeo.ogType,
    },
    {
      key: "og:locale",
      property: "og:locale",
      content: "en",
    },
    {
      key: "og:site_name",
      property: "og:site_name",
      content: pageSeo.siteName,
    },
    {
      key: "twitter:card",
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      key: "twitter:title",
      name: "twitter:title",
      content: pageSeo.title,
    },
    {
      key: "twitter:description",
      name: "twitter:description",
      content: pageSeo.description,
    },
  ];

  if (pageSeo.canonicalUrl) {
    tags.push({
      key: "og:url",
      property: "og:url",
      content: pageSeo.canonicalUrl,
    });
  }

  if (pageSeo.ogImageUrl) {
    tags.push(
      {
        key: "og:image",
        property: "og:image",
        content: pageSeo.ogImageUrl,
      },
      {
        key: "og:image:alt",
        property: "og:image:alt",
        content: pageSeo.ogImageAlt,
      },
      {
        key: "twitter:image",
        name: "twitter:image",
        content: pageSeo.ogImageUrl,
      },
      {
        key: "twitter:image:alt",
        name: "twitter:image:alt",
        content: pageSeo.ogImageAlt,
      },
    );
  }

  return tags;
};

export const upsertJsonLdScript = (
  doc: Document,
  jsonLd: JsonLd | undefined,
): void => {
  const existing = doc.getElementById(JSON_LD_SCRIPT_ID);

  if (!jsonLd) {
    existing?.remove();
    return;
  }

  const script =
    existing instanceof HTMLScriptElement
      ? existing
      : doc.createElement("script");
  script.id = JSON_LD_SCRIPT_ID;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(jsonLd);

  if (!existing) {
    doc.head.appendChild(script);
  }
};
