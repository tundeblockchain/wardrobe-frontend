import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeatureSection } from "./FeatureSection";
import { renderWithProviders } from "../../test/renderWithProviders";

describe("FeatureSection", () => {
  it("renders the four feature cards", () => {
    renderWithProviders(<FeatureSection />);

    expect(
      screen.getByRole("heading", { name: "Made for getting dressed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Catalog every piece" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Compose outfits" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Try looks on" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Keep item details" }),
    ).toBeInTheDocument();
  });
});
