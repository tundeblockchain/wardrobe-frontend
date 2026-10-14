import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ResourceEmptyState } from "./ResourceEmptyState";
import { ResourceErrorState } from "./ResourceErrorState";
import { ResourceLoadingState } from "./ResourceLoadingState";
import { CatalogLimitPrompt } from "./CatalogLimitPrompt";
import { ForbiddenUpgradePrompt } from "./ForbiddenUpgradePrompt";
import { ResourceUpgradeState } from "./ResourceUpgradeState";

describe("dashboard resource states", () => {
  it("renders a polite loading status", () => {
    renderWithProviders(<ResourceLoadingState label="Loading wardrobes" />);

    expect(
      screen.getByRole("status", { name: "Loading wardrobes" }),
    ).toBeInTheDocument();
  });

  it("renders an empty status card", () => {
    renderWithProviders(
      <ResourceEmptyState
        title="No wardrobes yet"
        description="Wardrobes you add in the app will appear here."
      />,
    );

    expect(
      screen.getByRole("heading", { name: "No wardrobes yet" }),
    ).toBeInTheDocument();
  });

  it("retries from the error state", async () => {
    const handleRetry = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ResourceErrorState
        title="Couldn't load wardrobes"
        description="Try again in a moment."
        retryLabel="Try loading wardrobes again"
        onRetry={handleRetry}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Try loading wardrobes again" }),
    );
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("links to the plan from the upgrade state", () => {
    renderWithProviders(
      <ResourceUpgradeState
        title="Virtual Try On is a Premium feature"
        description="Upgrade to browse Virtual Profiles."
        actionLabel="View plan"
        actionTo="/app/settings"
        actionAriaLabel="View plan for Virtual Try On"
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View plan for Virtual Try On" }),
    ).toHaveAttribute("href", "/app/settings");
  });

  it("links catalog limit prompts to Plan", () => {
    renderWithProviders(<CatalogLimitPrompt kind="wardrobe" />);

    expect(
      screen.getByRole("heading", { name: "Wardrobe limit reached" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View plan to add more wardrobes" }),
    ).toHaveAttribute("href", "/app/settings#plan");
  });

  it("renders catalog limit copy from non-default /me limits", () => {
    const limits = { wardrobes: 3, items: 12, outfits: 20 };

    const { unmount } = renderWithProviders(
      <CatalogLimitPrompt kind="wardrobe" limits={limits} />,
    );
    expect(
      screen.getByText(
        "The Free plan includes 3 wardrobes. Upgrade your plan to add another.",
      ),
    ).toBeInTheDocument();
    unmount();

    const itemView = renderWithProviders(
      <CatalogLimitPrompt kind="item" limits={limits} />,
    );
    expect(
      screen.getByText(
        "The Free plan includes 12 clothing items. Upgrade your plan to add another.",
      ),
    ).toBeInTheDocument();
    itemView.unmount();

    renderWithProviders(<CatalogLimitPrompt kind="outfit" limits={limits} />);
    expect(
      screen.getByText(
        "The Free plan includes 20 outfits. Upgrade your plan to add another.",
      ),
    ).toBeInTheDocument();
  });

  it("maps 403 codes to Basic or Premium upgrade prompts", () => {
    const { unmount } = renderWithProviders(
      <ForbiddenUpgradePrompt kind="basic" catalogKind="item" />,
    );
    expect(
      screen.getByRole("heading", { name: "Clothing item limit reached" }),
    ).toBeInTheDocument();
    unmount();

    renderWithProviders(<ForbiddenUpgradePrompt kind="premium" />);
    expect(
      screen.getByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    ).toBeInTheDocument();
  });

  it("renders fallback catalog limit copy without numbers", () => {
    renderWithProviders(<CatalogLimitPrompt kind="item" />);

    expect(
      screen.getByText(
        "This plan has reached its clothing item limit. Upgrade your plan to add another.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/1|5|3|12|20/),
    ).not.toBeInTheDocument();
  });
});
