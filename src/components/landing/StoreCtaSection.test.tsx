import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_APP_STORE_URL } from "../../config/env";
import { StoreCtaSection } from "./StoreCtaSection";
import { renderWithProviders } from "../../test/renderWithProviders";

describe("StoreCtaSection", () => {
  it("links the App Store button and leaves Google Play disabled", () => {
    renderWithProviders(
      <StoreCtaSection
        appName="Pocket Closet"
        appStoreUrl={undefined}
        playStoreUrl={undefined}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Get Pocket Closet" }),
    ).toBeInTheDocument();
    expect(
      screen
        .getByRole("heading", { name: "Get Pocket Closet" })
        .closest("[data-surface]"),
    ).toHaveAttribute("data-surface", "blush");
    expect(
      screen.getByText(
        /Download on the App Store\. Google Play stays disabled/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/store listings are not published yet/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/App Store — coming soon/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Download on the App Store" }),
    ).toHaveAttribute("href", DEFAULT_APP_STORE_URL);
    expect(
      screen.getByRole("button", { name: "Google Play — coming soon" }),
    ).toBeDisabled();
  });

  it("hides the unpublished notice when a store URL is set", () => {
    renderWithProviders(
      <StoreCtaSection
        appName="Pocket Closet"
        appStoreUrl="https://apps.apple.com/app/id000000000"
        playStoreUrl={undefined}
      />,
    );

    expect(
      screen.queryByText(/store listings are not published yet/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Download on the App Store" }),
    ).toHaveAttribute("href", "https://apps.apple.com/app/id000000000");
  });
});
