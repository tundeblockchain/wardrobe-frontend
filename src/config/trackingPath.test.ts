import { describe, expect, it } from "vitest";
import {
  getTrackingPageTitle,
  toTrackingPath,
  toTrackingPathname,
  toTrackingSearch,
} from "./trackingPath";

describe("toTrackingPathname", () => {
  it("keeps static public and app routes", () => {
    expect(toTrackingPathname("/")).toBe("/");
    expect(toTrackingPathname("/privacy")).toBe("/privacy");
    expect(toTrackingPathname("/app")).toBe("/app");
    expect(toTrackingPathname("/app/wardrobes/new")).toBe("/app/wardrobes/new");
    expect(toTrackingPathname("/app/outfits")).toBe("/app/outfits");
  });

  it("templates wardrobe, item, outfit, profile, and share IDs", () => {
    expect(toTrackingPathname("/app/wardrobes/wd_weekend01")).toBe(
      "/app/wardrobes/:id",
    );
    expect(toTrackingPathname("/app/wardrobes/wd_weekend01/edit")).toBe(
      "/app/wardrobes/:id/edit",
    );
    expect(toTrackingPathname("/app/wardrobes/wd_weekend01/items/new")).toBe(
      "/app/wardrobes/:id/items/new",
    );
    expect(
      toTrackingPathname("/app/wardrobes/wd_weekend01/recommendations"),
    ).toBe("/app/wardrobes/:id/recommendations");
    expect(
      toTrackingPathname("/app/wardrobes/wd_weekend01/recommendations/detail"),
    ).toBe("/app/wardrobes/:id/recommendations/detail");
    expect(toTrackingPathname("/app/items/item_navytee01")).toBe(
      "/app/items/:id",
    );
    expect(toTrackingPathname("/app/items/item_navytee01/edit")).toBe(
      "/app/items/:id/edit",
    );
    expect(toTrackingPathname("/app/outfits/outfit_brunch01/edit")).toBe(
      "/app/outfits/:id/edit",
    );
    expect(toTrackingPathname("/app/virtual-profiles/aip_1/edit")).toBe(
      "/app/virtual-profiles/:id/edit",
    );
    expect(toTrackingPathname("/share/shr_abcdefghijklmnopqrstu")).toBe(
      "/share/:token",
    );
  });
});

describe("toTrackingSearch", () => {
  it("keeps only allowlisted mode and type values", () => {
    expect(toTrackingSearch("?mode=signup")).toBe("?mode=signup");
    expect(toTrackingSearch("?type=bug")).toBe("?type=bug");
  });

  it("drops IDs, next paths, session ids, and search terms", () => {
    expect(toTrackingSearch("?wardrobeId=wd_weekend01")).toBe("");
    expect(toTrackingSearch("?next=%2Fapp%2Fwardrobes%2Fwd_1")).toBe("");
    expect(toTrackingSearch("?session_id=cs_test_abc")).toBe("");
    expect(toTrackingSearch("?q=navy%20tee")).toBe("");
    expect(toTrackingSearch("?mode=signup&next=/app")).toBe("?mode=signup");
  });
});

describe("toTrackingPath", () => {
  it("combines a templated path with a safe query", () => {
    expect(toTrackingPath("/login", "?mode=signup&next=/app")).toBe(
      "/login?mode=signup",
    );
    expect(
      toTrackingPath("/app/items/item_navytee01", "?wardrobeId=wd_weekend01"),
    ).toBe("/app/items/:id");
    expect(
      toTrackingPath("/app/billing/success", "?session_id=cs_test_abc"),
    ).toBe("/app/billing/success");
  });
});

describe("getTrackingPageTitle", () => {
  it("returns generic titles and never a raw ID", () => {
    expect(getTrackingPageTitle("/app/wardrobes/:id")).toBe("Wardrobe");
    expect(getTrackingPageTitle("/share/:token")).toBe("Shared look");
    expect(getTrackingPageTitle("/unknown")).toBe("Pocket Closet");
    expect(getTrackingPageTitle("/app/wardrobes/:id")).not.toMatch(/wd_/);
  });
});
