import { describe, expect, it } from "vitest";
import indexHtml from "../../index.html?raw";
import {
  DEFAULT_LANDING_DESCRIPTION,
  DEFAULT_LANDING_TITLE,
} from "./seo";

describe("static SEO fallback", () => {
  it("includes landing meta, Open Graph, Twitter, and JSON-LD without ratings or pixels", () => {
    expect(indexHtml).toContain(`<title>${DEFAULT_LANDING_TITLE}</title>`);
    expect(indexHtml).toContain(DEFAULT_LANDING_DESCRIPTION);
    expect(indexHtml).toContain('property="og:title"');
    expect(indexHtml).toContain('property="og:image"');
    expect(indexHtml).toContain('name="twitter:card"');
    expect(indexHtml).toContain('type="application/ld+json"');
    expect(indexHtml).toContain("SoftwareApplication");
    expect(indexHtml).toContain("LifestyleApplication");
    expect(indexHtml).not.toMatch(/aggregateRating|ratingValue|reviewCount/);
    expect(indexHtml).not.toContain("googletagmanager");
    expect(indexHtml).not.toContain("fbevents");
    expect(indexHtml).not.toContain("facebook.com/tr");
    expect(indexHtml).not.toContain("G-XXXXXXXXXX");
    expect(indexHtml).not.toContain("fbq(");
  });
});
