import { describe, expect, it } from "vitest";
import { appPaths } from "../routes/paths";
import { legalNavLinks, primaryNavLinks } from "./landingNav";

describe("landing navigation", () => {
  it("keeps Terms, Privacy, and Contact out of the header nav", () => {
    const headerHrefs = primaryNavLinks.map((link) =>
      link.kind === "route" ? link.to : link.href,
    );

    expect(headerHrefs).toEqual([
      "/#features",
      "/#screenshots",
      "/#download",
      appPaths.pricing,
    ]);
    expect(headerHrefs).not.toContain(appPaths.terms);
    expect(headerHrefs).not.toContain(appPaths.privacy);
    expect(headerHrefs).not.toContain(appPaths.contact);
    expect(legalNavLinks.map((link) => link.to)).toEqual([
      appPaths.terms,
      appPaths.privacy,
      appPaths.contact,
    ]);
  });
});
