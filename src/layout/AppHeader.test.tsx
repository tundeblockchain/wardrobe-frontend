import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppHeader } from "./AppHeader";
import { renderWithProviders } from "../test/renderWithProviders";

describe("AppHeader", () => {
  it("renders the brand home link and section navigation", () => {
    renderWithProviders(<AppHeader />);

    expect(
      screen.getByRole("link", { name: "Digital Wardrobe home" }),
    ).toHaveAttribute("href", "/");
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
  });
});
