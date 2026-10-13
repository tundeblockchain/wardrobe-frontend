import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import {
  ResourceCard,
  WARDROBE_CARD_IMAGE_ASPECT_RATIO,
} from "./ResourceCard";
import {
  RESOURCE_CARD_GRID_COLUMNS,
  RESOURCE_CARD_MAX_WIDTH_PX,
  RESOURCE_CARD_MIN_WIDTH_PX,
  ResourceCardGrid,
} from "./ResourceCardGrid";

describe("ResourceCardGrid", () => {
  it("lays cards out in an auto-fill grid of roughly 220-280px tracks", () => {
    renderWithProviders(
      <ResourceCardGrid label="Wardrobes">
        <li>One</li>
        <li>Two</li>
        <li>Three</li>
        <li>Four</li>
      </ResourceCardGrid>,
    );

    const grid = screen.getByRole("list", { name: "Wardrobes" });
    expect(grid).toHaveStyle({
      display: "grid",
      gridTemplateColumns: RESOURCE_CARD_GRID_COLUMNS,
    });
    expect(RESOURCE_CARD_GRID_COLUMNS).toContain("auto-fill");
    expect(RESOURCE_CARD_GRID_COLUMNS).toContain(
      `${RESOURCE_CARD_MIN_WIDTH_PX}px`,
    );
    expect(RESOURCE_CARD_GRID_COLUMNS).toContain(
      `${RESOURCE_CARD_MAX_WIDTH_PX}px`,
    );
    expect(grid.children).toHaveLength(4);
  });

  it("uses a 4:3 image area on wardrobe cards", () => {
    renderWithProviders(
      <ResourceCard
        title="Weekend closet"
        titleId="wardrobe-weekend-title"
        imageUrl="https://cdn.example.com/cover.jpg"
        imageAlt="Weekend closet"
        imageAspectRatio={WARDROBE_CARD_IMAGE_ASPECT_RATIO}
        fallbackLabel="No photo for this wardrobe"
      />,
    );

    expect(screen.getByRole("img", { name: "Weekend closet" })).toBeInTheDocument();
    expect(screen.getByTestId("resource-card-image-frame")).toHaveAttribute(
      "data-aspect-ratio",
      WARDROBE_CARD_IMAGE_ASPECT_RATIO,
    );
  });
});
