import { describe, expect, it } from "vitest";
import { SeoHead } from "./SeoHead";
import { getPublicAppEnv } from "../../config/env";
import { getPageSeo } from "../../content/seo";
import { renderWithProviders } from "../../test/renderWithProviders";

describe("SeoHead", () => {
  it("renders title, description, and Open Graph tags for the landing page", () => {
    const pageSeo = getPageSeo({
      pathname: "/",
      env: getPublicAppEnv({
        VITE_PUBLIC_SITE_URL: "https://example.com",
      }),
    });

    renderWithProviders(<SeoHead pageSeo={pageSeo} />);

    expect(document.title).toBe(pageSeo.title);
    expect(
      document.querySelector('meta[name="description"]')?.getAttribute("content"),
    ).toBe(pageSeo.description);
    expect(
      document.querySelector('meta[property="og:title"]')?.getAttribute("content"),
    ).toBe(pageSeo.title);
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    ).toBe("https://example.com/");
    expect(document.getElementById("wardrobe-json-ld")?.textContent).toContain(
      "SoftwareApplication",
    );
  });

  it("switches JSON-LD to a WebPage document on legal routes", () => {
    const pageSeo = getPageSeo({
      pathname: "/terms",
      env: getPublicAppEnv({
        VITE_PUBLIC_SITE_URL: "https://example.com",
      }),
    });

    renderWithProviders(<SeoHead pageSeo={pageSeo} />);

    expect(document.title).toContain("Terms of Service");
    expect(document.getElementById("wardrobe-json-ld")?.textContent).toContain(
      "WebPage",
    );
    expect(
      document.getElementById("wardrobe-json-ld")?.textContent,
    ).not.toContain("SoftwareApplication");
  });
});
