import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PrivacyPolicyPage } from "./PrivacyPolicyPage";
import { stubMatchMedia } from "../test/matchMedia";
import { renderWithProviders } from "../test/renderWithProviders";
import { appPaths } from "../routes/paths";
import { contrastRatio } from "../theme/colorContrast";
import { createDashboardTheme } from "../theme/createDashboardTheme";
import {
  THEME_PREFERENCE_STORAGE_KEY,
  writeThemePreference,
} from "../theme/themePreference";

describe("PrivacyPolicyPage", () => {
  afterEach(() => {
    window.localStorage.removeItem(THEME_PREFERENCE_STORAGE_KEY);
  });

  it("renders review-relevant privacy structure and a terms cross-link", () => {
    renderWithProviders(<PrivacyPolicyPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Information collected" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Photos, try-on, and automated processing" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Children/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Terms of Service" }),
    ).toHaveAttribute("href", appPaths.terms);
    expect(
      screen.getByText(/This Privacy Policy explains how the operator of Pocket Closet/),
    ).toBeInTheDocument();
    expect(screen.getByText("Last updated 7 November 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Cookies and similar technologies" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cookie settings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Firebase Authentication storage/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Google Analytics 4/)).toBeInTheDocument();
    expect(
      screen.getByText(/Marketing: the Meta Pixel and the TikTok pixel/),
    ).toBeInTheDocument();
  });

  it("renders mobile advertising attribution disclosures required for store review", () => {
    renderWithProviders(<PrivacyPolicyPage />);

    expect(
      screen.getByRole("heading", { name: "Mobile advertising and attribution" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "App Tracking Transparency" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "SKAdNetwork" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Android advertising identifier" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/TikTok Business SDK and the Meta Platforms Facebook SDK/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Apple’s App Tracking Transparency framework/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Apple’s SKAdNetwork for privacy-preserving attribution/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "TikTok Privacy Policy" }),
    ).toHaveAttribute(
      "href",
      "https://www.tiktok.com/legal/page/us/privacy-policy/en",
    );
    expect(
      screen.getByRole("link", { name: "Meta Privacy Policy" }),
    ).toHaveAttribute("href", "https://www.facebook.com/privacy/policy/");
  });

  it("keeps attribution copy readable in dark mode", () => {
    stubMatchMedia(true);
    writeThemePreference("dark");

    renderWithProviders(<PrivacyPolicyPage />);

    const attributionHeading = screen.getByRole("heading", {
      name: "Mobile advertising and attribution",
    });
    const tiktokLink = screen.getByRole("link", { name: "TikTok Privacy Policy" });
    const metaLink = screen.getByRole("link", { name: "Meta Privacy Policy" });
    const darkTheme = createDashboardTheme("dark");

    expect(attributionHeading).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "App Tracking Transparency" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "SKAdNetwork" }),
    ).toBeInTheDocument();
    expect(tiktokLink).toBeVisible();
    expect(metaLink).toBeVisible();
    expect(
      contrastRatio(
        darkTheme.palette.secondary.main,
        darkTheme.palette.background.paper,
      ),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(
        darkTheme.palette.text.secondary,
        darkTheme.palette.background.paper,
      ),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      attributionHeading.closest("[data-surface]"),
    ).toHaveAttribute("data-surface", "mist");
  });
});
