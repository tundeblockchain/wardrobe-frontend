import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppFooter } from "./AppFooter";
import { renderWithProviders } from "../test/renderWithProviders";
import { appPaths } from "../routes/paths";

describe("AppFooter", () => {
  it("renders landing section links and legal page links", () => {
    renderWithProviders(<AppFooter />);

    const footer = screen.getByRole("contentinfo");
    const landingNav = within(footer).getByRole("navigation", { name: "Footer" });
    const legalNav = within(footer).getByRole("navigation", { name: "Legal" });

    expect(
      within(landingNav).getByRole("link", { name: "Jump to features" }),
    ).toHaveAttribute("href", "/#features");
    expect(
      within(legalNav).getByRole("link", { name: "Terms of Service" }),
    ).toHaveAttribute("href", appPaths.terms);
    expect(
      within(legalNav).getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", appPaths.privacy);
    expect(footer).toHaveAttribute("data-surface", "mist");
  });
});
