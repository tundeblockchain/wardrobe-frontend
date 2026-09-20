import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppHeader } from "./AppHeader";
import { renderWithProviders } from "../test/renderWithProviders";
import { appPaths } from "../routes/paths";

describe("AppHeader", () => {
  it("renders the brand home link, section navigation, and legal links", () => {
    renderWithProviders(<AppHeader />);

    expect(
      screen.getByRole("link", { name: "Pocket Closet home" }),
    ).toHaveAttribute("href", appPaths.home);
    expect(screen.getByRole("link", { name: "Jump to features" })).toHaveAttribute(
      "href",
      "/#features",
    );
    expect(
      screen.getByRole("link", { name: "Jump to screenshot showcase" }),
    ).toHaveAttribute("href", "/#screenshots");
    expect(screen.getByRole("link", { name: "Jump to download" })).toHaveAttribute(
      "href",
      "/#download",
    );
    expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveAttribute(
      "href",
      appPaths.terms,
    );
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      appPaths.privacy,
    );
  });
});
