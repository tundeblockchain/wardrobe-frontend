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
  });
});
