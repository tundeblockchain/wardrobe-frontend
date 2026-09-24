import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingHero } from "./LandingHero";
import { renderWithProviders } from "../../test/renderWithProviders";

const heroAlt =
  "Pocket Closet Virtual Try On showing a rust floral maxi dress on the user's profile photo";

describe("LandingHero", () => {
  it("renders the value proposition, Virtual Try On hero, and store CTAs", () => {
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
    expect(screen.getByRole("img", { name: heroAlt })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "See the screenshot showcase" }),
    ).toHaveAttribute("href", "/#screenshots");
    expect(
      screen.getByRole("button", { name: "App Store — coming soon" }),
    ).toBeDisabled();
    expect(
      screen
        .getByRole("heading", {
          level: 1,
          name: "Your closet, beautifully organized",
        })
        .closest("[data-surface]"),
    ).toHaveAttribute("data-surface", "hero");
    expect(
      screen.getByRole("list", { name: "App screenshot samples" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ivory maxi screenshot sample" }),
    ).toHaveAttribute("href", "/#screenshots");
    expect(screen.getAllByRole("img", { name: heroAlt })).toHaveLength(1);
  });

  it("places sample thumbs under See the app and keeps the large hero phone", () => {
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
    const heroPhone = screen.getByRole("img", { name: heroAlt });

    expect(
      seeTheApp.compareDocumentPosition(thumbs) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      thumbs.compareDocumentPosition(heroPhone) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
