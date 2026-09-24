import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { screenshotSlots } from "../../content/screenshotSlots";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ScreenshotThumbs } from "./ScreenshotThumbs";

describe("ScreenshotThumbs", () => {
  it("renders smaller sample thumbs that link to the showcase", () => {
    const sampleSlots = screenshotSlots.slice(1);

    renderWithProviders(<ScreenshotThumbs slots={sampleSlots} />);

    expect(
      screen.getByRole("list", { name: "App screenshot samples" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ivory maxi screenshot sample" }),
    ).toHaveAttribute("href", "/#screenshots");
    expect(
      screen.getByRole("link", { name: "Blue mini screenshot sample" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Home screenshot sample" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Item detail screenshot sample" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Add item screenshot sample" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Virtual Try On screenshot sample" }),
    ).not.toBeInTheDocument();
  });

  it("returns nothing when there are no slots", () => {
    const { container } = renderWithProviders(<ScreenshotThumbs slots={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("activates a thumb with the space key", async () => {
    const user = userEvent.setup();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click");
    const sampleSlots = screenshotSlots.slice(1, 2);

    renderWithProviders(<ScreenshotThumbs slots={sampleSlots} />);

    const thumb = screen.getByRole("link", {
      name: "Ivory maxi screenshot sample",
    });
    thumb.focus();
    await user.keyboard(" ");

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});
