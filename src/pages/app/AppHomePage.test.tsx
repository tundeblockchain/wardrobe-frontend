import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetWardrobeCoverImageRetries } from "../../components/dashboard/wardrobeCoverImageReload";
import {
  createEmptyResourceApi,
  createErrorResourceApi,
  createMockResourceApi,
  WEEKEND_WARDROBE_IMAGE_URL,
  WORKWEAR_WARDROBE_COVER_IMAGE_URL,
} from "../../api/mockResourceApi";
import type { Wardrobe } from "../../api/resourceTypes";
import { getAppWardrobePath } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { AppHomePage } from "./AppHomePage";

const renderPage = (
  resourceApi: ReturnType<typeof createMockResourceApi>,
) => {
  return renderWithProviders(<AppHomePage resourceApi={resourceApi} />, {
    auth: { user: { id: "user-1", email: "user@example.com" } },
  });
};

const pendingApi = createMockResourceApi({
  listWardrobes: () => new Promise(() => undefined),
});

const wardrobe = (overrides: Partial<Wardrobe>): Wardrobe => {
  return {
    wardrobeId: "wd_1",
    name: "Sample wardrobe",
    createdAt: "2026-09-03T18:35:00.000Z",
    updatedAt: "2026-09-03T18:35:00.000Z",
    ...overrides,
  };
};

describe("AppHomePage", () => {
  beforeEach(() => {
    resetWardrobeCoverImageRetries();
  });

  it("renders a loading state", () => {
    renderPage(pendingApi);

    expect(
      screen.getByRole("heading", { level: 1, name: "Your closet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Loading wardrobes" }),
    ).toBeInTheDocument();
  });

  it("renders wardrobe cards that link to each wardrobe page", async () => {
    renderPage(createMockResourceApi());

    expect(
      await screen.findByRole("heading", { level: 1, name: "Your closet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Weekend closet" }),
    ).toHaveAttribute("href", getAppWardrobePath("wd_weekend01"));
    expect(screen.getByRole("link", { name: "Workwear" })).toHaveAttribute(
      "href",
      getAppWardrobePath("wd_work02"),
    );
    expect(
      screen.queryByRole("button", { name: /delete/i }),
    ).not.toBeInTheDocument();
  });

  it("uses the wardrobe image, then coverImageUrl as img src, then a placeholder", async () => {
    renderPage(
      createMockResourceApi(
        {},
        {
          wardrobes: [
            wardrobe({
              wardrobeId: "wd_image",
              name: "With image",
              imageUrl: "https://cdn.example.com/wardrobe.jpg",
              coverImageUrl: "https://cdn.example.com/cover.jpg",
            }),
            wardrobe({
              wardrobeId: "wd_cover",
              name: "With cover",
              coverImageUrl: "https://cdn.example.com/cover.jpg",
            }),
            wardrobe({
              wardrobeId: "wd_empty",
              name: "No photo",
            }),
          ],
        },
      ),
    );

    expect(await screen.findByRole("img", { name: "With image" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/wardrobe.jpg",
    );
    expect(screen.getByRole("img", { name: "With cover" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/cover.jpg",
    );
    expect(screen.queryByRole("img", { name: "No photo" })).not.toBeInTheDocument();
    expect(screen.getByText("No photo for this wardrobe")).toBeInTheDocument();
  });

  it("renders mock wardrobe and coverImageUrl values as img src", async () => {
    renderPage(createMockResourceApi());

    expect(
      await screen.findByRole("img", { name: "Weekend closet" }),
    ).toHaveAttribute("src", WEEKEND_WARDROBE_IMAGE_URL);
    expect(screen.getByRole("img", { name: "Workwear" })).toHaveAttribute(
      "src",
      WORKWEAR_WARDROBE_COVER_IMAGE_URL,
    );
  });

  it("does not request wardrobe items when a card already has a photo", async () => {
    const listWardrobeItems = vi.fn(async () => ({ items: [] }));
    const getWardrobeDetail = vi.fn(async () => {
      throw new Error("should not load wardrobe items for home cards");
    });

    renderPage(
      createMockResourceApi({
        listWardrobeItems,
        getWardrobeDetail,
      }),
    );

    expect(
      await screen.findByRole("link", { name: "Weekend closet" }),
    ).toBeInTheDocument();
    expect(listWardrobeItems).not.toHaveBeenCalled();
    expect(getWardrobeDetail).not.toHaveBeenCalled();
  });

  it("falls back to the first item photo only when a wardrobe has no cover", async () => {
    const listWardrobeItems = vi.fn(async (wardrobeId: string) => {
      if (wardrobeId !== "wd_items") {
        throw new Error(`unexpected items request for ${wardrobeId}`);
      }

      return {
        items: [
          {
            itemId: "item_from_wardrobe",
            wardrobeId,
            name: "Navy tee",
            category: "TOP" as const,
            processingStatus: "READY" as const,
            originalImageUrl: "https://cdn.example.com/item.jpg",
            createdAt: "2026-09-03T18:40:00.000Z",
            updatedAt: "2026-09-03T18:40:00.000Z",
          },
        ],
      };
    });

    renderPage(
      createMockResourceApi(
        { listWardrobeItems },
        {
          wardrobes: [
            wardrobe({
              wardrobeId: "wd_image",
              name: "With image",
              imageUrl: "https://cdn.example.com/wardrobe.jpg",
            }),
            wardrobe({
              wardrobeId: "wd_items",
              name: "From item",
            }),
          ],
        },
      ),
    );

    expect(await screen.findByRole("img", { name: "With image" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/wardrobe.jpg",
    );
    expect(screen.getByRole("img", { name: "From item" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/item.jpg",
    );
    expect(listWardrobeItems).toHaveBeenCalledTimes(1);
    expect(listWardrobeItems).toHaveBeenCalledWith("wd_items", { limit: 1 });
  });

  it("refreshes the list once for an expired coverImageUrl and then renders the image", async () => {
    const listWardrobes = vi
      .fn()
      .mockResolvedValueOnce({
        wardrobes: [
          wardrobe({
            wardrobeId: "wd_mine",
            name: "My wardrobe",
            coverImageUrl: "https://cdn.example.com/expired.jpg",
          }),
        ],
      })
      .mockResolvedValue({
        wardrobes: [
          wardrobe({
            wardrobeId: "wd_mine",
            name: "My wardrobe",
            coverImageUrl: "https://cdn.example.com/fresh.jpg",
          }),
        ],
      });

    renderPage(
      createMockResourceApi({
        listWardrobes,
        listWardrobeItems: async () => ({ items: [] }),
      }),
    );

    const expiredImage = await screen.findByRole("img", { name: "My wardrobe" });
    expect(expiredImage).toHaveAttribute(
      "src",
      "https://cdn.example.com/expired.jpg",
    );

    fireEvent.error(expiredImage);

    expect(
      await screen.findByRole("img", { name: "My wardrobe" }),
    ).toHaveAttribute("src", "https://cdn.example.com/fresh.jpg");
    expect(listWardrobes).toHaveBeenCalledTimes(2);
    expect(
      screen.queryByText("No photo for this wardrobe"),
    ).not.toBeInTheDocument();
  });

  it("refetches the wardrobe list once when a cover image fails", async () => {
    const listWardrobes = vi
      .fn()
      .mockResolvedValueOnce({
        wardrobes: [
          wardrobe({
            wardrobeId: "wd_mine",
            name: "My wardrobe",
            coverImageUrl: "https://cdn.example.com/expired.jpg",
          }),
        ],
      })
      .mockResolvedValueOnce({
        wardrobes: [
          wardrobe({
            wardrobeId: "wd_mine",
            name: "My wardrobe",
            coverImageUrl: "https://cdn.example.com/fresh.jpg",
          }),
        ],
      })
      .mockResolvedValue({
        wardrobes: [
          wardrobe({
            wardrobeId: "wd_mine",
            name: "My wardrobe",
            coverImageUrl: "https://cdn.example.com/still-bad.jpg",
          }),
        ],
      });

    renderPage(
      createMockResourceApi({
        listWardrobes,
        listWardrobeItems: async () => ({ items: [] }),
      }),
    );

    const expiredImage = await screen.findByRole("img", { name: "My wardrobe" });
    expect(expiredImage).toHaveAttribute(
      "src",
      "https://cdn.example.com/expired.jpg",
    );

    fireEvent.error(expiredImage);

    const freshImage = await screen.findByRole("img", { name: "My wardrobe" });
    expect(freshImage).toHaveAttribute(
      "src",
      "https://cdn.example.com/fresh.jpg",
    );
    expect(listWardrobes).toHaveBeenCalledTimes(2);

    fireEvent.error(freshImage);

    await waitFor(() => {
      expect(
        screen.getByText("No photo for this wardrobe"),
      ).toBeInTheDocument();
    });
    expect(listWardrobes).toHaveBeenCalledTimes(2);
  });

  it("shows the placeholder when the items fallback fails", async () => {
    const listWardrobeItems = vi.fn(async () => {
      throw new Error("items unavailable");
    });

    renderPage(
      createMockResourceApi(
        { listWardrobeItems },
        {
          wardrobes: [wardrobe({ wardrobeId: "wd_empty", name: "No photo" })],
        },
      ),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Your closet" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "No photo" })).not.toBeInTheDocument();
    expect(screen.getByText("No photo for this wardrobe")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Couldn't load wardrobes" }),
    ).not.toBeInTheDocument();
    expect(listWardrobeItems).toHaveBeenCalledTimes(1);
  });

  it("renders an empty state when there are no wardrobes", async () => {
    renderPage(createEmptyResourceApi());

    expect(
      await screen.findByRole("heading", { name: "No wardrobes yet" }),
    ).toBeInTheDocument();
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
