import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  HERO_IMAGE_ALT,
  HERO_IMAGE_ASPECT_RATIO,
  HERO_IMAGE_PATH,
} from "../../content/brandAssets";
import { renderWithProviders } from "../../test/renderWithProviders";
import {
  LANDING_HERO_IMAGE_SLOT_TEST_ID,
  LANDING_HERO_IMAGE_TEST_ID,
  LANDING_HERO_LAYOUT_TEST_ID,
  LandingHero,
} from "./LandingHero";

describe("LandingHero", () => {
  it("renders the value proposition, transparent hero phones, and store CTAs", () => {
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
      screen.getByRole("img", { name: HERO_IMAGE_ALT }),
    ).toHaveAttribute("src", HERO_IMAGE_PATH);
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
    expect(screen.getAllByRole("img", { name: HERO_IMAGE_ALT })).toHaveLength(1);
  });

  it("keeps copy and CTAs beside the uncropped transparent phones", () => {
    renderWithProviders(
      <LandingHero
        appName="Pocket Closet"
        appStoreUrl={undefined}
        playStoreUrl={undefined}
      />,
    );

    const layout = screen.getByTestId(LANDING_HERO_LAYOUT_TEST_ID);
    const heroImage = screen.getByTestId(LANDING_HERO_IMAGE_TEST_ID);
    const imageSlot = screen.getByTestId(LANDING_HERO_IMAGE_SLOT_TEST_ID);
    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Your closet, beautifully organized",
    });
    const seeTheApp = screen.getByRole("link", {
      name: "See the screenshot showcase",
    });
    const thumbs = screen.getByRole("list", { name: "App screenshot samples" });

    expect(layout).toHaveStyle({ maxWidth: "100%" });
    expect(heroImage).toHaveAttribute("src", HERO_IMAGE_PATH);
    expect(heroImage).toHaveAttribute("alt", HERO_IMAGE_ALT);
    expect(heroImage).toHaveAttribute("data-object-fit", "contain");
    expect(heroImage).toHaveAttribute("data-aspect-ratio", HERO_IMAGE_ASPECT_RATIO);
    expect(heroImage).toHaveStyle({
      width: "auto",
      height: "auto",
      objectFit: "contain",
      borderRadius: "0px",
      boxShadow: "none",
      backgroundColor: "rgba(0, 0, 0, 0)",
    });
    expect(imageSlot).toHaveStyle({
      width: "100%",
      overflow: "visible",
      boxShadow: "none",
      borderRadius: "0px",
      backgroundColor: "rgba(0, 0, 0, 0)",
    });
    expect(
      heading.compareDocumentPosition(seeTheApp) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      seeTheApp.compareDocumentPosition(thumbs) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      thumbs.compareDocumentPosition(heroImage) & Node.DOCUMENT_POSITION_FOLLOWING,
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
