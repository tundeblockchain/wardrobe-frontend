import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StoreCtaSection } from "./StoreCtaSection";
import { renderWithProviders } from "../../test/renderWithProviders";

describe("StoreCtaSection", () => {
  it("explains that store buttons stay disabled without env URLs", () => {
    renderWithProviders(
      <StoreCtaSection
        appName="Digital Wardrobe"
        appStoreUrl={undefined}
        playStoreUrl={undefined}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Get Digital Wardrobe" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/store listings are not published yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "App Store — coming soon" }),
    ).toBeDisabled();
  });

  it("hides the unpublished notice when a store URL is set", () => {
    renderWithProviders(
      <StoreCtaSection
        appName="Digital Wardrobe"
        appStoreUrl="https://apps.apple.com/app/id000000000"
        playStoreUrl={undefined}
      />,
    );

    expect(
      screen.queryByText(/store listings are not published yet/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Download on the App Store" }),
    ).toBeInTheDocument();
  });
});
