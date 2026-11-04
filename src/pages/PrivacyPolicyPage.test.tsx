import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrivacyPolicyPage } from "./PrivacyPolicyPage";
import { renderWithProviders } from "../test/renderWithProviders";
import { appPaths } from "../routes/paths";

describe("PrivacyPolicyPage", () => {
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
    expect(screen.getByText("Last updated 4 November 2026")).toBeInTheDocument();
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
});
