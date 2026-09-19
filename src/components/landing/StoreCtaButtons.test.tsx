import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StoreCtaButtons } from "./StoreCtaButtons";
import { renderWithProviders } from "../../test/renderWithProviders";
import { STORE_CTA_GA_EVENT, STORE_CTA_META_EVENT } from "../../config/tracking";

const publishedStoreUrls = {
  appStoreUrl: "https://apps.apple.com/app/id000000000",
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.example.wardrobe",
};

describe("StoreCtaButtons", () => {
  afterEach(() => {
    delete window.gtag;
    delete window.fbq;
  });

  it("renders disabled coming-soon buttons when store URLs are empty", () => {
    renderWithProviders(
      <StoreCtaButtons
        appStoreUrl={undefined}
        playStoreUrl={undefined}
        placement="hero"
      />,
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
        {...publishedStoreUrls}
        placement="download"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Download on the App Store" }),
    ).toHaveAttribute("href", publishedStoreUrls.appStoreUrl);
    expect(
      screen.getByRole("link", { name: "Get it on Google Play" }),
    ).toHaveAttribute("href", publishedStoreUrls.playStoreUrl);
  });

  it("does not fire analytics when tracking IDs are empty", async () => {
    const user = userEvent.setup();
    window.gtag = vi.fn();
    window.fbq = vi.fn();

    renderWithProviders(
      <StoreCtaButtons
        {...publishedStoreUrls}
        placement="hero"
        trackingIds={{
          gaMeasurementId: undefined,
          metaPixelId: undefined,
        }}
      />,
    );

    await user.click(
      screen.getByRole("link", { name: "Download on the App Store" }),
    );
    await user.click(
      screen.getByRole("link", { name: "Get it on Google Play" }),
    );

    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.fbq).not.toHaveBeenCalled();
  });

  it("does not fire analytics when tracking IDs are omitted", async () => {
    const user = userEvent.setup();
    window.gtag = vi.fn();
    window.fbq = vi.fn();

    renderWithProviders(
      <StoreCtaButtons {...publishedStoreUrls} placement="download" />,
    );

    await user.click(
      screen.getByRole("link", { name: "Download on the App Store" }),
    );

    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.fbq).not.toHaveBeenCalled();
  });

  it("fires store CTA click events for the hero App Store button when IDs are set", async () => {
    const user = userEvent.setup();
    window.gtag = vi.fn();
    window.fbq = vi.fn();

    renderWithProviders(
      <StoreCtaButtons
        {...publishedStoreUrls}
        placement="hero"
        trackingIds={{
          gaMeasurementId: "G-XXXXXXXXXX",
          metaPixelId: "000000000000000",
        }}
      />,
    );

    await user.click(
      screen.getByRole("link", { name: "Download on the App Store" }),
    );

    expect(window.gtag).toHaveBeenCalledWith("event", STORE_CTA_GA_EVENT, {
      store: "appStore",
      placement: "hero",
    });
    expect(window.fbq).toHaveBeenCalledWith(
      "trackCustom",
      STORE_CTA_META_EVENT,
      {
        store: "appStore",
        placement: "hero",
      },
    );
    expect(window.gtag).not.toHaveBeenCalledWith(
      "event",
      "page_view",
      expect.anything(),
    );
    expect(window.fbq).not.toHaveBeenCalledWith("track", "PageView");
  });

  it("fires store CTA click events for the download Play Store button when IDs are set", async () => {
    const user = userEvent.setup();
    window.gtag = vi.fn();
    window.fbq = vi.fn();

    renderWithProviders(
      <StoreCtaButtons
        {...publishedStoreUrls}
        placement="download"
        trackingIds={{
          gaMeasurementId: "G-XXXXXXXXXX",
          metaPixelId: "000000000000000",
        }}
      />,
    );

    await user.click(screen.getByRole("link", { name: "Get it on Google Play" }));

    expect(window.gtag).toHaveBeenCalledWith("event", STORE_CTA_GA_EVENT, {
      store: "playStore",
      placement: "download",
    });
    expect(window.fbq).toHaveBeenCalledWith(
      "trackCustom",
      STORE_CTA_META_EVENT,
      {
        store: "playStore",
        placement: "download",
      },
    );
  });
});
