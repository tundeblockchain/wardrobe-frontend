import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  BANNER_ALT,
  BANNER_ASPECT_RATIO,
  BANNER_PATH,
} from "../../content/brandAssets";
import { renderWithProviders } from "../../test/renderWithProviders";
import {
  LANDING_HERO_BANNER_FRAME_TEST_ID,
  LANDING_HERO_BANNER_TEST_ID,
  LANDING_HERO_LAYOUT_TEST_ID,
  LandingHero,
} from "./LandingHero";

describe("LandingHero", () => {
  it("renders the value proposition, brand banner, and store CTAs", () => {
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
    expect(screen.getByRole("img", { name: BANNER_ALT })).toHaveAttribute(
      "src",
      BANNER_PATH,
    );
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
    expect(screen.getAllByRole("img", { name: BANNER_ALT })).toHaveLength(1);
  });

  it("keeps copy and CTAs beside the uncropped banner", () => {
    renderWithProviders(
      <LandingHero
        appName="Pocket Closet"
        appStoreUrl={undefined}
        playStoreUrl={undefined}
      />,
    );

    const layout = screen.getByTestId(LANDING_HERO_LAYOUT_TEST_ID);
    const heroBanner = screen.getByTestId(LANDING_HERO_BANNER_TEST_ID);
    const bannerFrame = screen.getByTestId(LANDING_HERO_BANNER_FRAME_TEST_ID);
    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Your closet, beautifully organized",
    });
    const seeTheApp = screen.getByRole("link", {
      name: "See the screenshot showcase",
    });
    const thumbs = screen.getByRole("list", { name: "App screenshot samples" });

    expect(layout).toHaveStyle({ maxWidth: "100%" });
    expect(heroBanner).toHaveAttribute("src", BANNER_PATH);
    expect(heroBanner).toHaveAttribute("alt", BANNER_ALT);
    expect(heroBanner).toHaveAttribute("data-object-fit", "contain");
    expect(heroBanner).toHaveAttribute("data-aspect-ratio", BANNER_ASPECT_RATIO);
    expect(heroBanner).toHaveStyle({
      width: "100%",
      height: "auto",
      objectFit: "contain",
    });
    expect(bannerFrame).toHaveStyle({
      width: "100%",
      overflow: "visible",
    });
    expect(
      heading.compareDocumentPosition(seeTheApp) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      seeTheApp.compareDocumentPosition(thumbs) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      thumbs.compareDocumentPosition(heroBanner) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("does not introduce restricted product copy", () => {
    const { container } = renderWithProviders(
      <LandingHero
        appName="Pocket Closet"
        appStoreUrl={undefined}
        playStoreUrl={undefined}
      />,
    );

    expect(container.textContent).not.toMatch(/\bAI\b/);
    expect(container.textContent).not.toContain("AI Profile");
  });
});
