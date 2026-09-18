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
      screen.getByRole("tab", { name: "Home screenshot" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("img", { name: "Placeholder for the Home screen" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("tab", { name: "Try-on screenshot" }),
    );

    expect(
      screen.getByRole("tab", { name: "Try-on screenshot" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("img", { name: "Placeholder for the Try-on screen" }),
    ).toBeInTheDocument();
  });

  it("selects a slot from the labeled gallery", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ScreenshotShowcase />);

    await user.click(
      screen.getByRole("button", {
        name: "Account placeholder screenshot",
      }),
    );

    expect(
      screen.getByRole("img", { name: "Placeholder for the Account screen" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Account screenshot" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("moves the featured screenshot with arrow keys", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ScreenshotShowcase />);

    const homeTab = screen.getByRole("tab", { name: "Home screenshot" });
    homeTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(
      screen.getByRole("tab", { name: "Wardrobe detail screenshot" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("img", {
        name: "Placeholder for the Wardrobe detail screen",
      }),
    ).toBeInTheDocument();
  });
});
