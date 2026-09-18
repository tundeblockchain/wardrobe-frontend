import { useEffect } from "react";
import {
  getDocumentMetaTags,
  upsertJsonLdScript,
  type PageSeo,
} from "../../content/seo";

export type SeoHeadProps = {
  pageSeo: PageSeo;
};

export const SeoHead = ({ pageSeo }: SeoHeadProps) => {
  const jsonLdText = JSON.stringify(pageSeo.jsonLd);
  const metaTags = getDocumentMetaTags(pageSeo);

  useEffect(() => {
    document.title = pageSeo.title;
    upsertJsonLdScript(document, JSON.parse(jsonLdText) as PageSeo["jsonLd"]);
  }, [jsonLdText, pageSeo.title]);

  return (
    <>
      <title>{pageSeo.title}</title>
      {pageSeo.canonicalUrl ? (
        <link rel="canonical" href={pageSeo.canonicalUrl} />
      ) : null}
      {metaTags.map((tag) => {
        if (tag.property) {
          return (
            <meta key={tag.key} property={tag.property} content={tag.content} />
          );
        }

        return <meta key={tag.key} name={tag.name} content={tag.content} />;
      })}
    </>
  );
};
