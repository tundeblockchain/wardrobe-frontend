import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingHero } from "./LandingHero";
import { renderWithProviders } from "../../test/renderWithProviders";

describe("LandingHero", () => {
  it("renders the value proposition, home placeholder, and store CTAs", () => {
    renderWithProviders(
      <LandingHero
        appName="Digital Wardrobe"
        appStoreUrl={undefined}
        playStoreUrl={undefined}
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Your closet, beautifully organized",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Placeholder for the Home screen" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "See the screenshot showcase" }),
    ).toHaveAttribute("href", "/#screenshots");
    expect(
      screen.getByRole("button", { name: "App Store — coming soon" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Your closet, beautifully organized",
      }).closest("[data-surface]"),
    ).toHaveAttribute("data-surface", "hero");
  });
});
