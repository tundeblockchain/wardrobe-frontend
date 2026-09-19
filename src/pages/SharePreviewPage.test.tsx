import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getPublicAppEnv } from "../config/env";
import { getSharePath } from "../routes/paths";
import { renderWithProviders } from "../test/renderWithProviders";
import { SharePreviewPage } from "./SharePreviewPage";

const exampleEnv = getPublicAppEnv({
  VITE_APP_NAME: "Digital Wardrobe",
  VITE_API_BASE_URL: "https://api.example.com",
  VITE_APP_STORE_URL: "https://apps.apple.com/app/id000000000",
  VITE_PLAY_STORE_URL:
    "https://play.google.com/store/apps/details?id=com.example.wardrobe",
  VITE_PUBLIC_SITE_URL: "https://example.com",
});

const shareToken = "shr_abcdefghijklmnopqrstu";

describe("SharePreviewPage", () => {
  it("renders the preview card and store CTAs when the public GET succeeds", async () => {
    const requestSharePreview = vi.fn().mockResolvedValue({
      status: "ok",
      preview: {
        resourceType: "ITEM",
        title: "Black T-Shirt",
        imageUrl: "https://cdn.example.com/item.jpg",
        expiresAt: "2026-10-19T12:00:00.000Z",
      },
    });

    renderWithProviders(
      <SharePreviewPage
        env={exampleEnv}
        token={shareToken}
        requestSharePreview={requestSharePreview}
      />,
      { route: getSharePath(shareToken) },
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Black T-Shirt" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Shared type: Item")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Open this look in Digital Wardrobe",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Download on the App Store" }),
    ).toHaveAttribute("href", exampleEnv.appStoreUrl);
    expect(
      screen.getByRole("link", { name: "Get it on Google Play" }),
    ).toHaveAttribute("href", exampleEnv.playStoreUrl);
    expect(document.title).toBe("Black T-Shirt — Digital Wardrobe");
    expect(requestSharePreview).toHaveBeenCalledWith({
      apiBaseUrl: "https://api.example.com",
      token: shareToken,
    });
  });

  it("shows a clear 404 state", async () => {
    renderWithProviders(
      <SharePreviewPage
        env={exampleEnv}
        token={shareToken}
        requestSharePreview={vi.fn().mockResolvedValue({ status: "not_found" })}
      />,
      { route: getSharePath(shareToken) },
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "This share isn't available",
      }),
    ).toBeInTheDocument();
    expect(document.title).toContain("isn't available");
  });

  it("shows a clear 410 expired state", async () => {
    renderWithProviders(
      <SharePreviewPage
        env={exampleEnv}
        token={shareToken}
        requestSharePreview={vi.fn().mockResolvedValue({ status: "gone" })}
      />,
      { route: getSharePath(shareToken) },
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "This share has expired",
      }),
    ).toBeInTheDocument();
  });

  it("retries after a network failure", async () => {
    const user = userEvent.setup();
    const requestSharePreview = vi
      .fn()
      .mockResolvedValueOnce({ status: "network" })
      .mockResolvedValueOnce({
        status: "ok",
        preview: {
          resourceType: "OUTFIT",
          title: "Weekend brunch",
          expiresAt: "2026-10-19T12:00:00.000Z",
        },
      });

    renderWithProviders(
      <SharePreviewPage
        env={exampleEnv}
        token={shareToken}
        requestSharePreview={requestSharePreview}
      />,
      { route: getSharePath(shareToken) },
    );

    expect(
      await screen.findByRole("heading", {
        name: "Couldn't load this share",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Try loading this share again" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Weekend brunch" }),
    ).toBeInTheDocument();
    expect(requestSharePreview).toHaveBeenCalledTimes(2);
  });

  it("shows a couldn't-load state when the API base is unset", async () => {
    renderWithProviders(
      <SharePreviewPage
        env={getPublicAppEnv({})}
        token={shareToken}
        requestSharePreview={vi.fn().mockResolvedValue({ status: "misconfigured" })}
      />,
      { route: getSharePath(shareToken) },
    );

    expect(
      await screen.findByRole("heading", {
        name: "Couldn't load this share",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/preview service is temporarily unavailable/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "App Store — coming soon" }),
    ).toBeDisabled();
  });
});
