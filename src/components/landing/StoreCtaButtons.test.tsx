import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StoreCtaButtons } from "./StoreCtaButtons";
import { renderWithProviders } from "../../test/renderWithProviders";

describe("StoreCtaButtons", () => {
  it("renders disabled coming-soon buttons when store URLs are empty", () => {
    renderWithProviders(
      <StoreCtaButtons appStoreUrl={undefined} playStoreUrl={undefined} />,
    );

    expect(
      screen.getByRole("button", { name: "App Store — coming soon" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Google Play — coming soon" }),
    ).toBeDisabled();
  });

  it("renders store links when URLs are provided", () => {
    renderWithProviders(
      <StoreCtaButtons
        appStoreUrl="https://apps.apple.com/app/id000000000"
        playStoreUrl="https://play.google.com/store/apps/details?id=com.example.wardrobe"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Download on the App Store" }),
    ).toHaveAttribute("href", "https://apps.apple.com/app/id000000000");
    expect(
      screen.getByRole("link", { name: "Get it on Google Play" }),
    ).toHaveAttribute(
      "href",
      "https://play.google.com/store/apps/details?id=com.example.wardrobe",
    );
  });
});
