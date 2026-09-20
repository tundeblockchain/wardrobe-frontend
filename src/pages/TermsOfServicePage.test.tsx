import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TermsOfServicePage } from "./TermsOfServicePage";
import { renderWithProviders } from "../test/renderWithProviders";
import { appPaths } from "../routes/paths";

describe("TermsOfServicePage", () => {
  it("renders review-relevant terms structure and a privacy cross-link", () => {
    renderWithProviders(<TermsOfServicePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Terms of Service" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Accounts" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "User content" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Mobile apps and stores" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", appPaths.privacy);
    expect(
      screen.getByText(/Pocket Closet is a wardrobe companion/),
    ).toBeInTheDocument();
  });
});
