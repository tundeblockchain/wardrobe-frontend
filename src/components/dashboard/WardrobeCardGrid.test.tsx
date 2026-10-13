import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockWardrobes } from "../../api/mockResourceApi";
import { renderWithProviders } from "../../test/renderWithProviders";
import { WARDROBE_CARD_IMAGE_ASPECT_RATIO } from "./ResourceCard";
import { RESOURCE_CARD_GRID_COLUMNS } from "./ResourceCardGrid";
import { WardrobeCardGrid } from "./WardrobeCardGrid";

describe("WardrobeCardGrid", () => {
  it("renders wardrobe cards in the auto-fill grid with a 4:3 image area", () => {
    renderWithProviders(<WardrobeCardGrid wardrobes={mockWardrobes} />);

    expect(screen.getByRole("list", { name: "Wardrobes" })).toHaveStyle({
      display: "grid",
      gridTemplateColumns: RESOURCE_CARD_GRID_COLUMNS,
    });
    expect(screen.getAllByTestId("resource-card-image-frame")[0]).toHaveAttribute(
      "data-aspect-ratio",
      WARDROBE_CARD_IMAGE_ASPECT_RATIO,
    );
  });
});
