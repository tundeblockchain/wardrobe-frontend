import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionSurface } from "./SectionSurface";
import { renderWithProviders } from "../../test/renderWithProviders";
import { wardrobePalette } from "../../theme/wardrobePalette";

describe("SectionSurface", () => {
  it("keeps the named surface slot without a blush wash or landmark change", () => {
    renderWithProviders(
      <SectionSurface
        component="section"
        variant="hero"
        aria-labelledby="surface-heading"
      >
        <h2 id="surface-heading">Landing surface</h2>
      </SectionSurface>,
    );

    const surface = screen.getByRole("region", { name: "Landing surface" });
    const backgroundImage = getComputedStyle(surface).backgroundImage;
    const backgroundColor = getComputedStyle(surface).backgroundColor;

    expect(surface).toHaveAttribute("data-surface", "hero");
    expect(backgroundImage === "none" || backgroundImage === "").toBe(true);
    expect(backgroundImage).not.toMatch(/radial-gradient/i);
    expect(backgroundImage).not.toMatch(/linear-gradient/i);
    expect(backgroundImage).not.toContain("rgb(252, 239, 244)");
    expect(backgroundImage).not.toContain("rgb(255, 248, 251)");
    expect(backgroundColor).toBe("rgb(248, 243, 245)");
    expect(wardrobePalette.backgroundDefault).toBe("#F8F3F5");
  });
});
