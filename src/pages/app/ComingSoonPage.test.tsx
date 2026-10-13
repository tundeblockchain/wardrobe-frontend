import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { PlanPage } from "./PlanPage";

describe("app placeholder pages", () => {
  it("renders the Plan coming soon page", () => {
    renderWithProviders(<PlanPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Plan" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Plan is coming soon/)).toBeInTheDocument();
  });
});
