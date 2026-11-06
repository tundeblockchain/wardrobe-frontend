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
import {
  createEmptyWishlistApi,
  createErrorWishlistApi,
  createMockWishlistApi,
  createPendingWishlistApi,
  mockWishes,
  wishlistLimitError,
  type WishlistApi,
} from "../../api/wishlistApi";
import { renderWithProviders } from "../../test/renderWithProviders";
import { WishListRow } from "./WishListRow";

const renderRow = (
  wishlistApi: WishlistApi,
  resourceApi: ResourceApi = createMockResourceApi(),
) => {
  return renderWithProviders(
    <WishListRow wishlistApi={wishlistApi} resourceApi={resourceApi} />,
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

    expect(
      await screen.findByText(
        "Wish list can hold 500 pieces. Remove one to add another.",
      ),
    ).toBeInTheDocument();
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
      wishId: "wish_loafers01",
      wardrobeId: "wd_weekend01",
      item: { itemId: "item_from_wish", wardrobeId: "wd_weekend01" },
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
      wishId: "wish_loafers01",
      wardrobeId: "wd_work02",
      item: { itemId: "item_from_wish", wardrobeId: "wd_work02" },
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
