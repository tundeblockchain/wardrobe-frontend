import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  createEmptyResourceApi,
  createErrorResourceApi,
  createMockResourceApi,
} from "../../api/mockResourceApi";
import { WARDROBE_COVER_ITEM_LIMIT } from "../../api/resourceApi";
import type { Wardrobe } from "../../api/resourceTypes";
import { getAppWardrobePath } from "../../routes/paths";
import {
  expectActionButtonNotFullWidth,
  expectInsideNarrowContent,
} from "../../test/dashboardNarrowContentTest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { WardrobesPage } from "./WardrobesPage";

const renderPage = (
  resourceApi: ReturnType<typeof createMockResourceApi>,
) => {
  return renderWithProviders(<WardrobesPage resourceApi={resourceApi} />, {
    auth: { user: { id: "user-1" } },
  });
};

const pendingApi = createMockResourceApi({
  listWardrobes: () => new Promise(() => undefined),
});

describe("WardrobesPage", () => {
  it("renders a loading state", () => {
    renderPage(pendingApi);

    expect(
      screen.getByRole("heading", { level: 1, name: "Wardrobes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Loading wardrobes" }),
    ).toBeInTheDocument();
  });

  it("renders wardrobe cards from the mock API", async () => {
    renderPage(createMockResourceApi());

    expect(
      await screen.findByRole("heading", { level: 1, name: "Wardrobes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Weekend closet" }),
    ).toHaveAttribute("href", getAppWardrobePath("wd_weekend01"));
    expect(screen.getByRole("link", { name: "Workwear" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Add a wardrobe" }),
    ).toHaveAttribute("href", "/app/wardrobes/new");
    expect(
      screen.queryByRole("button", { name: /delete/i }),
    ).not.toBeInTheDocument();
  });

  it("uses the first item photo when a wardrobe card has no cover", async () => {
    const listWardrobeItems = vi.fn(async () => ({
      items: [
        {
          itemId: "item_photo",
          wardrobeId: "wd_items",
          name: "Navy tee",
          category: "TOP" as const,
          processingStatus: "READY" as const,
          originalImageUrl: "https://cdn.example.com/item.jpg",
          createdAt: "2026-09-03T18:40:00.000Z",
          updatedAt: "2026-09-03T18:40:00.000Z",
        },
      ],
    }));
    const coverlessWardrobe: Wardrobe = {
      wardrobeId: "wd_items",
      name: "From item",
      createdAt: "2026-09-03T18:35:00.000Z",
      updatedAt: "2026-09-03T18:35:00.000Z",
    };

    renderPage(
      createMockResourceApi(
        { listWardrobeItems },
        { wardrobes: [coverlessWardrobe] },
      ),
    );

    expect(await screen.findByRole("img", { name: "From item" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/item.jpg",
    );
    expect(listWardrobeItems).toHaveBeenCalledWith("wd_items", {
      limit: WARDROBE_COVER_ITEM_LIMIT,
    });
  });

  it("renders an empty state when there are no wardrobes", async () => {
    renderPage(createEmptyResourceApi());

    expectInsideNarrowContent(
      await screen.findByRole("heading", { name: "No wardrobes yet" }),
    );
    expectActionButtonNotFullWidth(
      screen.getByRole("link", { name: "Add a wardrobe" }),
    );
  });

  it("renders an error state and retries", async () => {
    const user = userEvent.setup();
    renderPage(createErrorResourceApi());

    expect(
      await screen.findByRole("heading", { name: "Couldn't load wardrobes" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Try loading wardrobes again" }),
    );
    expect(
      screen.getByRole("heading", { name: "Couldn't load wardrobes" }),
    ).toBeInTheDocument();
  });
});
