import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockWardrobes } from "../../api/mockResourceApi";
import type { Wardrobe } from "../../api/resourceTypes";
import {
  CATALOG_LIST_QUERY_KEYS,
  invalidateResourceQueries,
} from "../../hooks/resourceQueryCache";
import { renderWithProviders } from "../../test/renderWithProviders";
import { WARDROBE_CARD_IMAGE_ASPECT_RATIO } from "./ResourceCard";
import { RESOURCE_CARD_GRID_COLUMNS } from "./ResourceCardGrid";
import { resetWardrobeCoverImageRetries } from "./wardrobeCoverImageReload";
import { WardrobeCardGrid } from "./WardrobeCardGrid";

vi.mock("../../hooks/resourceQueryCache", async () => {
  const actual = await vi.importActual<
    typeof import("../../hooks/resourceQueryCache")
  >("../../hooks/resourceQueryCache");
  return {
    ...actual,
    invalidateResourceQueries: vi.fn(),
  };
});

const wardrobe = (overrides: Partial<Wardrobe>): Wardrobe => {
  return {
    wardrobeId: "wd_1",
    name: "My wardrobe",
    createdAt: "2026-09-03T18:35:00.000Z",
    updatedAt: "2026-09-03T18:35:00.000Z",
    ...overrides,
  };
};

describe("WardrobeCardGrid", () => {
  beforeEach(() => {
    resetWardrobeCoverImageRetries();
    vi.mocked(invalidateResourceQueries).mockClear();
  });

  it("renders coverImageUrl as img src when the wardrobe has no own image", () => {
    renderWithProviders(
      <WardrobeCardGrid
        wardrobes={[
          wardrobe({
            coverImageUrl: "https://cdn.example.com/cover.jpg",
          }),
        ]}
      />,
    );

    expect(screen.getByRole("img", { name: "My wardrobe" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/cover.jpg",
    );
    expect(screen.queryByText("No photo for this wardrobe")).not.toBeInTheDocument();
  });

  it("renders the placeholder when the list row has no image fields", () => {
    renderWithProviders(<WardrobeCardGrid wardrobes={[wardrobe({})]} />);

    expect(screen.queryByRole("img", { name: "My wardrobe" })).not.toBeInTheDocument();
    expect(screen.getByText("No photo for this wardrobe")).toBeInTheDocument();
  });

  it("invalidates the wardrobe list once when a cover image fails", () => {
    const wardrobes = [
      wardrobe({
        coverImageUrl: "https://cdn.example.com/expired.jpg",
      }),
    ];
    const { unmount } = renderWithProviders(
      <WardrobeCardGrid wardrobes={wardrobes} />,
    );

    fireEvent.error(screen.getByRole("img", { name: "My wardrobe" }));
    expect(invalidateResourceQueries).toHaveBeenCalledTimes(1);

    unmount();
    renderWithProviders(<WardrobeCardGrid wardrobes={wardrobes} />);
    fireEvent.error(screen.getByRole("img", { name: "My wardrobe" }));

    expect(invalidateResourceQueries).toHaveBeenCalledTimes(1);
    expect(invalidateResourceQueries).toHaveBeenCalledWith([
      CATALOG_LIST_QUERY_KEYS.wardrobes,
    ]);
  });

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
