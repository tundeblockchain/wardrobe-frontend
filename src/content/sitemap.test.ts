import { describe, expect, it } from "vitest";
import { isExcludedFromSitemap, PUBLIC_SITEMAP_PATHS } from "./sitemap";

describe("PUBLIC_SITEMAP_PATHS", () => {
  it("lists public marketing pages and excludes the operator inbox", () => {
    expect(PUBLIC_SITEMAP_PATHS).toEqual([
      "/",
      "/terms",
      "/privacy",
      "/contact",
      "/pricing",
    ]);
    expect(PUBLIC_SITEMAP_PATHS).not.toContain("/admin");
    expect(PUBLIC_SITEMAP_PATHS).not.toContain("/admin/support");
    expect(isExcludedFromSitemap("/admin")).toBe(true);
    expect(isExcludedFromSitemap("/admin/support")).toBe(true);
    expect(isExcludedFromSitemap("/admin/support/conv_1")).toBe(true);
    expect(isExcludedFromSitemap("/")).toBe(false);
    expect(isExcludedFromSitemap("/contact")).toBe(false);
  });
});
