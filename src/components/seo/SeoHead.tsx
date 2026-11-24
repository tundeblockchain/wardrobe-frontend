import { useEffect } from "react";
import {
  getDocumentMetaTags,
  upsertCanonicalLink,
  upsertDocumentMetaTag,
  upsertJsonLdScript,
  type PageSeo,
} from "../../content/seo";

export type SeoHeadProps = {
  pageSeo: PageSeo;
};

export const SeoHead = ({ pageSeo }: SeoHeadProps) => {
  const jsonLdText = JSON.stringify(pageSeo.jsonLd);
  const metaSignature = getDocumentMetaTags(pageSeo)
    .map((tag) => `${tag.key}:${tag.content}`)
    .join("|");

  useEffect(() => {
    document.title = pageSeo.title;
    upsertJsonLdScript(document, JSON.parse(jsonLdText) as PageSeo["jsonLd"]);
    upsertCanonicalLink(document, pageSeo.canonicalUrl);
    getDocumentMetaTags(pageSeo).forEach((tag) => {
      upsertDocumentMetaTag(document, tag);
    });
  }, [jsonLdText, metaSignature, pageSeo, pageSeo.canonicalUrl, pageSeo.title]);

  return <title>{pageSeo.title}</title>;
};
