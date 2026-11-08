import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { catalogLimitError } from "../../api/catalogLimits";
import {
  createFreeAtLimitResourceApi,
  createFreeResourceApi,
  createMockResourceApi,
  mockWardrobes,
} from "../../api/mockResourceApi";
import type { ResourceApi } from "../../api/resourceApi";
import { ENTITLEMENT_AI_REQUIRED_CODE } from "../../api/resourceTypes";
import {
  createEmptyWishlistApi,
  createErrorWishlistApi,
  createMockWishlistApi,
  createPendingWishlistApi,
  mockIncompleteWish,
  mockWishes,
  WISH_CATEGORY_REQUIRED_CODE,
  WISH_IMAGE_REQUIRED_CODE,
  WISHLIST_LIMIT_MESSAGE,
  wishlistLimitError,
  type WishItem,
  type WishlistApi,
} from "../../api/wishlistApi";
import { ApiError } from "../../api/httpClient";
import { renderWithProviders } from "../../test/renderWithProviders";
import { WishListRow } from "./WishListRow";

const renderRow = (
  wishlistApi: WishlistApi,
  resourceApi: ResourceApi = createMockResourceApi(),
  pollIntervalMs = 0,
) => {
  return renderWithProviders(
    <WishListRow
      wishlistApi={wishlistApi}
      resourceApi={resourceApi}
      pollIntervalMs={pollIntervalMs}
    />,
    {
      auth: { user: { id: "user-1", email: "user@example.com" } },
    },
  );
};

describe("WishListRow", () => {
  it("renders skeleton cards while the wish list loads", () => {
    renderRow(createPendingWishlistApi());

    expect(
      screen.getByRole("status", { name: "Loading wish list" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("wish-list-skeleton")).toBeInTheDocument();
    expect(screen.queryByText("Upgrade to Basic")).not.toBeInTheDocument();
  });

  it("renders an error state and retries", async () => {
    const user = userEvent.setup();
    const listWishes = vi
      .fn()
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValue({ wishes: mockWishes });
    renderRow(createMockWishlistApi({ listWishes }));

    expect(
      await screen.findByRole("heading", { name: "Couldn't load wish list" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Try loading wish list again" }),
    );

    expect(
      await screen.findByRole("button", { name: "Black loafers" }),
    ).toBeInTheDocument();
  });

  it("renders an empty state with an add button", async () => {
    renderRow(createEmptyWishlistApi());

    expect(
      await screen.findByRole("heading", { name: "No wishes yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add to wish list" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/upgrade/i)).not.toBeInTheDocument();
  });

  it("renders wish cards with a trailing add card", async () => {
    renderRow(createMockWishlistApi());

    expect(
      await screen.findByRole("heading", { level: 2, name: "Wish list" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Black loafers" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tan trench" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Forest scarf" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Wish list" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add to wish list" }),
    ).toBeInTheDocument();
  });

  it("lets a Free-tier user open and save a wish with no paywall", async () => {
    const user = userEvent.setup();
    const created = {
      wishId: "wish_new",
      name: "Wanted coat",
      createdAt: "2026-10-13T12:00:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
    };
    const createWish = vi.fn().mockResolvedValue(created);
    const listWishes = vi
      .fn()
      .mockResolvedValueOnce({ wishes: [] })
      .mockResolvedValue({ wishes: [created] });
    renderRow(
      createMockWishlistApi({ createWish, listWishes }),
      createFreeAtLimitResourceApi(),
    );

    await user.click(
      await screen.findByRole("button", { name: "Add to wish list" }),
    );
    expect(
      screen.getByRole("heading", { name: "Add to wish list" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Clothing item limit reached")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Upgrade to Basic to add more clothing items",
      }),
    ).not.toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "Name" }), "Wanted coat");
    await user.click(screen.getByRole("button", { name: "Save wish" }));

    await waitFor(() => {
      expect(createWish).toHaveBeenCalledWith({ name: "Wanted coat" });
    });
    expect(
      await screen.findByRole("button", { name: "Wanted coat" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/upgrade/i)).not.toBeInTheDocument();
  });

  it("shows a plain cap message when create is rejected at 500 wishes", async () => {
    const user = userEvent.setup();
    const createWish = vi.fn().mockRejectedValue(wishlistLimitError());
    renderRow(
      createMockWishlistApi({ createWish }, { wishes: [] }),
      createFreeResourceApi(),
    );

    await user.click(
      await screen.findByRole("button", { name: "Add to wish list" }),
    );
    await user.type(screen.getByRole("textbox", { name: "Name" }), "One more");
    await user.click(screen.getByRole("button", { name: "Save wish" }));

    expect(await screen.findByText(WISHLIST_LIMIT_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText("Clothing item limit reached")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Upgrade to Basic to add more clothing items",
      }),
    ).not.toBeInTheDocument();
  });

  it("rejects non-https links in the form", async () => {
    const user = userEvent.setup();
    const createWish = vi.fn();
    renderRow(createMockWishlistApi({ createWish }));

    await user.click(
      await screen.findByRole("button", { name: "Add to wish list" }),
    );
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Coat");
    await user.type(screen.getByRole("textbox", { name: "Link" }), "http://example.com/coat");
    await user.click(screen.getByRole("button", { name: "Save wish" }));

    expect(
      await screen.findByText("Enter an https:// link."),
    ).toBeInTheDocument();
    expect(createWish).not.toHaveBeenCalled();
  });

  it("opens https links with target blank and noopener", async () => {
    const user = userEvent.setup();
    renderRow(createMockWishlistApi());

    await user.click(
      await screen.findByRole("button", { name: "Black loafers" }),
    );
    const openLink = screen.getByRole("link", {
      name: "Open product link in a new tab",
    });
    expect(openLink).toHaveAttribute("href", "https://example.com/black-loafers");
    expect(openLink).toHaveAttribute("target", "_blank");
    expect(openLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not offer a link for a wish without an https URL", async () => {
    const user = userEvent.setup();
    renderRow(createMockWishlistApi());

    await user.click(
      await screen.findByRole("button", { name: "Forest scarf" }),
    );
    expect(
      screen.queryByRole("link", { name: "Open product link in a new tab" }),
    ).not.toBeInTheDocument();
  });

  it("acquires into the only wardrobe without a picker", async () => {
    const user = userEvent.setup();
    const acquireWish = vi.fn().mockResolvedValue({
      itemId: "item_from_wish",
      wardrobeId: "wd_weekend01",
      name: "Black loafers",
      category: "SHOES",
      processingStatus: "READY",
      createdAt: "2026-10-13T12:00:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
    });
    const listWishes = vi
      .fn()
      .mockResolvedValueOnce({ wishes: mockWishes })
      .mockResolvedValue({
        wishes: mockWishes.filter((wish) => wish.wishId !== "wish_loafers01"),
      });
    renderRow(
      createMockWishlistApi({ acquireWish, listWishes }),
      createMockResourceApi(
        {},
        { wardrobes: [mockWardrobes[0]!] },
      ),
    );

    await user.click(
      await screen.findByRole("button", { name: "Black loafers" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Mark this wish as owned" }),
    );

    await waitFor(() => {
      expect(acquireWish).toHaveBeenCalledWith("wish_loafers01", {
        wardrobeId: "wd_weekend01",
      });
    });
    expect(
      screen.queryByRole("heading", { name: "Choose a wardrobe" }),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Black loafers" }),
      ).not.toBeInTheDocument();
    });
  });

  it("shows a wardrobe picker when the user has more than one wardrobe", async () => {
    const user = userEvent.setup();
    const acquireWish = vi.fn().mockResolvedValue({
      itemId: "item_from_wish",
      wardrobeId: "wd_work02",
      name: "Black loafers",
      category: "SHOES",
      processingStatus: "READY",
      createdAt: "2026-10-13T12:00:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
    });
    renderRow(createMockWishlistApi({ acquireWish }));

    await user.click(
      await screen.findByRole("button", { name: "Black loafers" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Mark this wish as owned" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Choose a wardrobe" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "Wardrobe" }));
    await user.click(await screen.findByRole("option", { name: "Workwear" }));
    await user.click(
      screen.getByRole("button", {
        name: "Move this wish into the selected wardrobe",
      }),
    );

    await waitFor(() => {
      expect(acquireWish).toHaveBeenCalledWith("wish_loafers01", {
        wardrobeId: "wd_work02",
      });
    });
  });

  it("keeps the wish and shows the item-cap paywall when acquire hits the clothing item limit", async () => {
    const user = userEvent.setup();
    const acquireWish = vi.fn().mockRejectedValue(catalogLimitError("item"));
    renderRow(
      createMockWishlistApi({ acquireWish }),
      createFreeAtLimitResourceApi(),
    );

    await user.click(
      await screen.findByRole("button", { name: "Black loafers" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Mark this wish as owned" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Clothing item limit reached",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Upgrade to Basic to add more clothing items",
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(
      await screen.findByRole("button", { name: "Black loafers" }),
    ).toBeInTheDocument();
  });

  it("deletes a wish after confirm", async () => {
    const user = userEvent.setup();
    const deleteWish = vi.fn().mockResolvedValue(undefined);
    const listWishes = vi
      .fn()
      .mockResolvedValueOnce({ wishes: mockWishes })
      .mockResolvedValue({
        wishes: mockWishes.filter((wish) => wish.wishId !== "wish_scarf01"),
      });
    renderRow(createMockWishlistApi({ deleteWish, listWishes }));

    await user.click(
      await screen.findByRole("button", { name: "Forest scarf" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Delete this wish" }),
    );
    expect(
      screen.getByRole("heading", { name: "Delete wish?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteWish).toHaveBeenCalledWith("wish_scarf01");
    });
  });

  it("prompts for a missing category and photo before acquire", async () => {
    const user = userEvent.setup();
    const acquireWish = vi.fn();
    renderRow(
      createMockWishlistApi({ acquireWish }, { wishes: [mockIncompleteWish] }),
      createMockResourceApi({}, { wardrobes: [mockWardrobes[0]!] }),
    );

    await user.click(await screen.findByRole("button", { name: "Linen shirt" }));
    await user.click(
      screen.getByRole("button", { name: "Mark this wish as owned" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Add a few details first" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Mark as owned needs a category and a photo. Save those, then try again.",
      ),
    ).toBeInTheDocument();
    expect(acquireWish).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Add the missing category or photo" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Edit wish" }),
    ).toBeInTheDocument();
  });

  it("prompts for a missing photo before acquire", async () => {
    const user = userEvent.setup();
    const acquireWish = vi.fn();
    renderRow(
      createMockWishlistApi({ acquireWish }),
      createMockResourceApi({}, { wardrobes: [mockWardrobes[0]!] }),
    );

    await user.click(await screen.findByRole("button", { name: "Forest scarf" }));
    await user.click(
      screen.getByRole("button", { name: "Mark this wish as owned" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Add a few details first" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Mark as owned needs a photo. Save that, then try again.",
      ),
    ).toBeInTheDocument();
    expect(acquireWish).not.toHaveBeenCalled();
  });

  it("loads additional pages from nextCursor", async () => {
    const pageOne: WishItem = mockWishes[0]!;
    const pageTwo: WishItem = mockWishes[1]!;
    const listWishes = vi
      .fn()
      .mockResolvedValueOnce({
        wishes: [pageOne],
        nextCursor: pageOne.wishId,
      })
      .mockResolvedValueOnce({
        wishes: [pageTwo],
      });
    renderRow(createMockWishlistApi({ listWishes }));

    expect(
      await screen.findByRole("button", { name: "Black loafers" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tan trench" })).toBeInTheDocument();
    expect(listWishes).toHaveBeenCalledTimes(2);
  });

  it("is keyboard accessible on cards", async () => {
    const user = userEvent.setup();
    renderRow(createMockWishlistApi());

    const card = await screen.findByRole("button", { name: "Black loafers" });
    expect(card).toHaveAttribute("tabindex", "0");
    card.focus();
    await user.keyboard("{Enter}");
    expect(
      await screen.findByRole("button", { name: "Mark this wish as owned" }),
    ).toBeInTheDocument();
  });
});

describe("WishListRow Virtual Try On", () => {
  it("shows Virtual Try On on wish detail", async () => {
    const user = userEvent.setup();
    renderRow(createMockWishlistApi(), createMockResourceApi(), 0);

    await user.click(
      await screen.findByRole("button", { name: "Black loafers" }),
    );
    expect(
      screen.getByRole("button", { name: "Virtual Try On this wish" }),
    ).toBeInTheDocument();
  });

  it("does not POST when the wish has no photo", async () => {
    const user = userEvent.setup();
    const renderWish = vi.fn();
    renderRow(
      createMockWishlistApi({ renderWish }),
      createMockResourceApi(),
      0,
    );

    await user.click(
      await screen.findByRole("button", { name: "Forest scarf" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Virtual Try On this wish" }),
    );

    expect(
      screen.getByText("Virtual Try On needs a photo. Add one, then try again."),
    ).toBeInTheDocument();
    expect(renderWish).not.toHaveBeenCalled();
  });

  it("does not POST when the wish has no category", async () => {
    const user = userEvent.setup();
    const renderWish = vi.fn();
    const wish: WishItem = {
      ...mockIncompleteWish,
      image: { originalKey: "users/user-1/wishlist/uploads/shirt.jpg" },
      originalImageUrl: "/screenshots/item-detail-390.jpg",
    };
    renderRow(
      createMockWishlistApi({ renderWish }, { wishes: [wish] }),
      createMockResourceApi(),
      0,
    );

    await user.click(await screen.findByRole("button", { name: "Linen shirt" }));
    await user.click(
      screen.getByRole("button", { name: "Virtual Try On this wish" }),
    );

    expect(
      screen.getByText(
        "Virtual Try On needs a category. Pick one, then try again.",
      ),
    ).toBeInTheDocument();
    expect(renderWish).not.toHaveBeenCalled();
  });

  it("shows the Premium paywall on 403", async () => {
    const user = userEvent.setup();
    const renderWish = vi.fn().mockRejectedValue(
      new ApiError({
        status: 403,
        code: ENTITLEMENT_AI_REQUIRED_CODE,
        message: "Premium is required for Virtual Try On.",
      }),
    );
    renderRow(
      createMockWishlistApi({ renderWish }),
      createMockResourceApi(),
      0,
    );

    await user.click(
      await screen.findByRole("button", { name: "Black loafers" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Virtual Try On this wish" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    ).toBeInTheDocument();
  });

  it("maps server WISH_IMAGE_REQUIRED and WISH_CATEGORY_REQUIRED to the same prompts", async () => {
    const user = userEvent.setup();
    const renderWish = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({
          status: 400,
          code: WISH_IMAGE_REQUIRED_CODE,
          message: "Wish needs a photo.",
        }),
      )
      .mockRejectedValueOnce(
        new ApiError({
          status: 400,
          code: WISH_CATEGORY_REQUIRED_CODE,
          message: "Wish needs a category.",
        }),
      );
    renderRow(
      createMockWishlistApi({ renderWish }),
      createMockResourceApi(),
      0,
    );

    await user.click(
      await screen.findByRole("button", { name: "Black loafers" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Virtual Try On this wish" }),
    );
    expect(
      await screen.findByText(
        "Virtual Try On needs a photo. Add one, then try again.",
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Virtual Try On this wish" }),
    );
    expect(
      await screen.findByText(
        "Virtual Try On needs a category. Pick one, then try again.",
      ),
    ).toBeInTheDocument();
  });

  it("shows history from renderHistory", async () => {
    const user = userEvent.setup();
    const wish: WishItem = {
      ...mockWishes[0]!,
      renderHistory: [
        {
          imageKey: "users/user-1/wishlist/wish_loafers01/renders/a.png",
          createdAt: "2026-10-13T12:00:00.000Z",
          aiProfileId: "aip_personal01",
          imageUrl: "/screenshots/try-on-started.jpg",
        },
        {
          imageKey: "users/user-1/wishlist/wish_loafers01/renders/b.png",
          createdAt: "2026-10-01T12:00:00.000Z",
          aiProfileId: "aip_personal01",
          imageUrl: "/screenshots/try-on-ivory-maxi-390.jpg",
        },
      ],
    };
    renderRow(
      createMockWishlistApi({}, { wishes: [wish] }),
      createMockResourceApi(),
      0,
    );

    await user.click(
      await screen.findByRole("button", { name: "Black loafers" }),
    );
    const result = screen.getByRole("region", {
      name: "Virtual Try On result",
    });
    expect(
      within(result).getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-started.jpg");
    const gallery = screen.getByRole("region", { name: "Try On photos" });
    expect(
      within(gallery).getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-ivory-maxi-390.jpg");
  });
});

describe("WishListRow error helper", () => {
  it("renders the shared error API state", async () => {
    renderRow(createErrorWishlistApi());

    expect(
      await screen.findByRole("heading", { name: "Couldn't load wish list" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("wish-list-row")).queryByText(/upgrade/i),
    ).not.toBeInTheDocument();
  });
});
