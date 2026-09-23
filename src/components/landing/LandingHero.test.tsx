import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingHero } from "./LandingHero";
import { renderWithProviders } from "../../test/renderWithProviders";

describe("LandingHero", () => {
  it("renders the value proposition, home placeholder, and store CTAs", () => {
    renderWithProviders(
      <LandingHero
        appName="Pocket Closet"
        appStoreUrl={undefined}
        playStoreUrl={undefined}
      />,
    );

    expect(screen.getByText("Pocket Closet")).toBeInTheDocument();
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
    expect(
      screen.getByRole("list", { name: "App screenshot samples" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Outfits screenshot sample" }),
    ).toHaveAttribute("href", "/#screenshots");
    expect(
      screen.getAllByRole("img", { name: "Placeholder for the Home screen" }),
    ).toHaveLength(1);
  });

  it("places sample thumbs under See the app and keeps the large home phone", () => {
    renderWithProviders(
      <LandingHero
        appName="Pocket Closet"
        appStoreUrl={undefined}
        playStoreUrl={undefined}
      />,
    );

    const seeTheApp = screen.getByRole("link", {
      name: "See the screenshot showcase",
    });
    const thumbs = screen.getByRole("list", { name: "App screenshot samples" });
    const homePhone = screen.getByRole("img", {
      name: "Placeholder for the Home screen",
    });

    expect(
      seeTheApp.compareDocumentPosition(thumbs) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      thumbs.compareDocumentPosition(homePhone) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
