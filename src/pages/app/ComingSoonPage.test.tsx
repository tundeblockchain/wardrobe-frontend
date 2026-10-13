import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { OutfitsPage } from "./OutfitsPage";
import { PlanPage } from "./PlanPage";
import { VirtualProfilesPage } from "./VirtualProfilesPage";
import { WardrobesPage } from "./WardrobesPage";

describe("app placeholder pages", () => {
  it("renders the Wardrobes coming soon page", () => {
    renderWithProviders(<WardrobesPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Wardrobes" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Wardrobes are coming soon/)).toBeInTheDocument();
  });

  it("renders the Outfits coming soon page", () => {
    renderWithProviders(<OutfitsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Outfits" }),
    ).toBeInTheDocument();
  });

  it("uses Virtual Profile and Virtual Try On on the Virtual Profiles page", () => {
    renderWithProviders(<VirtualProfilesPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Virtual Profiles" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Create a Virtual Profile and preview looks with Virtual Try On/),
    ).toBeInTheDocument();
  });

  it("renders the Plan coming soon page", () => {
    renderWithProviders(<PlanPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Plan" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Plan is coming soon/)).toBeInTheDocument();
  });
});
