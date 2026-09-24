import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ScreenshotShowcase } from "./ScreenshotShowcase";
import { renderWithProviders } from "../../test/renderWithProviders";

describe("ScreenshotShowcase", () => {
  it("renders labeled slots and updates the featured screenshot", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ScreenshotShowcase />);

    expect(
      screen.getByRole("heading", { name: "See the app" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "See the app" }).closest("[data-surface]"),
    ).toHaveAttribute("data-surface", "mist");
    expect(
      screen.getByRole("tab", { name: "Virtual Try On screenshot" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("img", {
        name: "Pocket Closet Virtual Try On showing a rust floral maxi dress on the user's profile photo",
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Home screenshot" }));

    expect(screen.getByRole("tab", { name: "Home screenshot" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("img", {
        name: "Pocket Closet home screen titled My Pocket Closet with recent dresses and the My wardrobe collection",
      }),
    ).toBeInTheDocument();
  });

  it("selects a slot from the labeled gallery", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ScreenshotShowcase />);

    await user.click(
      screen.getByRole("button", {
        name: "Add item screenshot",
      }),
    );

    expect(
      screen.getByRole("img", {
        name: "Pocket Closet add item screen with a powder blue chiffon mini dress photo and clothing details form",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Add item screenshot" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("moves the featured screenshot with arrow keys", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ScreenshotShowcase />);

    const heroTab = screen.getByRole("tab", { name: "Virtual Try On screenshot" });
    heroTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(
      screen.getByRole("tab", { name: "Ivory maxi screenshot" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("img", {
        name: "Pocket Closet Virtual Try On showing an ivory maxi dress on the user's profile photo, viewed from behind",
      }),
    ).toBeInTheDocument();
  });
});
