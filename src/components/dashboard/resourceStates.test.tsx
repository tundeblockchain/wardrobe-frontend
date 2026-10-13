import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ResourceEmptyState } from "./ResourceEmptyState";
import { ResourceErrorState } from "./ResourceErrorState";
import { ResourceLoadingState } from "./ResourceLoadingState";

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
});
