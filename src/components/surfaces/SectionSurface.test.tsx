import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionSurface } from "./SectionSurface";
import { renderWithProviders } from "../../test/renderWithProviders";

describe("SectionSurface", () => {
  it("applies the named blush gradient without changing landmark roles", () => {
    renderWithProviders(
      <SectionSurface
        component="section"
        variant="hero"
        aria-labelledby="surface-heading"
      >
        <h2 id="surface-heading">Blush surface</h2>
      </SectionSurface>,
    );

    const surface = screen.getByRole("region", { name: "Blush surface" });
    const backgroundImage = getComputedStyle(surface).backgroundImage;

    expect(surface).toHaveAttribute("data-surface", "hero");
    expect(backgroundImage).toMatch(/radial-gradient/i);
    expect(backgroundImage).toMatch(/linear-gradient/i);
    expect(backgroundImage).toContain("rgb(252, 239, 244)");
    expect(backgroundImage).toContain("rgb(255, 248, 251)");
  });
});
