import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import {
  CONSENT_STORAGE_KEY,
  clearConsent,
  getConsent,
  openCookiePreferences,
} from "../../config/consent";
import { renderWithProviders } from "../../test/renderWithProviders";
import { CookieConsentHost } from "./CookieConsentHost";

describe("CookieConsentHost", () => {
  afterEach(() => {
    clearConsent();
    document
      .querySelectorAll("[data-wardrobe-tracking]")
      .forEach((element) => element.remove());
    delete window.gtag;
    delete window.fbq;
    delete window.ttq;
  });

  it("shows the banner until a choice is saved", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CookieConsentHost />);

    expect(
      screen.getByRole("dialog", { name: "Cookies on Pocket Closet" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Accept all cookies" }));

    expect(
      screen.queryByRole("dialog", { name: "Cookies on Pocket Closet" }),
    ).not.toBeInTheDocument();
    expect(getConsent()?.analytics).toBe(true);
    expect(getConsent()?.marketing).toBe(true);
  });

  it("stores reject all and hides the banner", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CookieConsentHost />);

    await user.click(
      screen.getByRole("button", { name: "Reject all optional cookies" }),
    );

    expect(getConsent()).toEqual(
      expect.objectContaining({ analytics: false, marketing: false }),
    );
    expect(
      screen.queryByRole("dialog", { name: "Cookies on Pocket Closet" }),
    ).not.toBeInTheDocument();
  });

  it("opens preferences from Manage preferences and from Cookie settings", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CookieConsentHost />);

    await user.click(
      screen.getByRole("button", { name: "Manage cookie preferences" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Cookie preferences" }),
    ).toBeVisible();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: "Cookie preferences" }),
    ).not.toBeInTheDocument();

    openCookiePreferences();
    expect(
      await screen.findByRole("dialog", { name: "Cookie preferences" }),
    ).toBeVisible();
  });

  it("does not show the banner when a current-version choice is stored", () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        analytics: false,
        marketing: false,
        ts: 1,
        version: 1,
      }),
    );

    renderWithProviders(<CookieConsentHost />);

    expect(
      screen.queryByRole("dialog", { name: "Cookies on Pocket Closet" }),
    ).not.toBeInTheDocument();
  });
});
