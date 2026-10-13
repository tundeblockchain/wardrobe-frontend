import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ResourceEmptyState } from "./ResourceEmptyState";
import { ResourceErrorState } from "./ResourceErrorState";
import { ResourceLoadingState } from "./ResourceLoadingState";
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
        actionTo="/app/plan"
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
    ).toHaveAttribute("href", "/app/plan");
  });
});
