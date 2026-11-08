import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockEntitlement } from "../../api/mockResourceApi";
import type { WishItem } from "../../api/wishlistApi";
import { mockWishes } from "../../api/wishlistApi";
import { VIRTUAL_TRY_ON_RESULT_TEST_ID } from "../../pages/app/VirtualTryOnResultCard";
import { renderWithProviders } from "../../test/renderWithProviders";
import { WishTryOnAction } from "./WishTryOnAction";
import { WishTryOnFailedState } from "./WishTryOnFailedState";
import { WishTryOnGallery } from "./WishTryOnGallery";
import { WishTryOnMissingDetailsPrompt } from "./WishTryOnMissingDetailsPrompt";
import { WishTryOnPanel } from "./WishTryOnPanel";
import { WishTryOnProfilePrompt } from "./WishTryOnProfilePrompt";

const wishWithHistory: WishItem = {
  ...mockWishes[0]!,
  render: {
    status: "READY",
    aiProfileId: "aip_personal01",
    imageKey: "users/user-1/wishlist/wish_loafers01/renders/newest.png",
    imageUrl: "/screenshots/try-on-started.jpg",
  },
  renderHistory: [
    {
      imageKey: "users/user-1/wishlist/wish_loafers01/renders/newest.png",
      createdAt: "2026-10-13T12:00:00.000Z",
      aiProfileId: "aip_personal01",
      imageUrl: "/screenshots/try-on-started.jpg",
    },
    {
      imageKey: "users/user-1/wishlist/wish_loafers01/renders/older.png",
      createdAt: "2026-10-01T12:00:00.000Z",
      aiProfileId: "aip_personal01",
      imageUrl: "/screenshots/try-on-ivory-maxi-390.jpg",
    },
  ],
};

describe("WishTryOnAction", () => {
  it("labels the Virtual Try On control", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    renderWithProviders(<WishTryOnAction onClick={handleClick} />);

    await user.click(
      screen.getByRole("button", { name: "Virtual Try On this wish" }),
    );
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe("WishTryOnMissingDetailsPrompt", () => {
  it("prompts for a photo and links to edit", async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();
    renderWithProviders(
      <WishTryOnMissingDetailsPrompt
        missing={{ category: false, image: true }}
        onEdit={handleEdit}
      />,
    );

    expect(
      screen.getByText("Virtual Try On needs a photo. Add one, then try again."),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Add the missing photo or category" }),
    );
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it("prompts for a category", () => {
    renderWithProviders(
      <WishTryOnMissingDetailsPrompt
        missing={{ category: true, image: false }}
        onEdit={() => undefined}
      />,
    );

    expect(
      screen.getByText(
        "Virtual Try On needs a category. Pick one, then try again.",
      ),
    ).toBeInTheDocument();
  });
});

describe("WishTryOnProfilePrompt", () => {
  it("links to add a Virtual Profile", () => {
    renderWithProviders(<WishTryOnProfilePrompt />);

    expect(
      screen.getByRole("link", { name: "Set up a Virtual Profile for Try On" }),
    ).toHaveAttribute("href", "/app/virtual-profiles/new");
  });
});

describe("WishTryOnFailedState", () => {
  it("retries after a failed render", async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();
    renderWithProviders(
      <WishTryOnFailedState
        message="The Virtual Try On render could not be created."
        onRetry={handleRetry}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Retry Virtual Try On" }));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});

describe("WishTryOnGallery", () => {
  it("shows history photos and confirms delete", async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn();
    renderWithProviders(
      <WishTryOnGallery
        photos={[
          {
            imageUrl: "/screenshots/try-on-ivory-maxi-390.jpg",
            imageKey: "users/user-1/wishlist/wish_loafers01/renders/older.png",
          },
        ]}
        onDelete={handleDelete}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Try On photos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-ivory-maxi-390.jpg");

    await user.click(
      screen.getByRole("button", { name: "Delete this Try On photo 1" }),
    );
    expect(
      screen.getByRole("heading", { name: "Delete this Try On photo?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete photo" }));
    expect(handleDelete).toHaveBeenCalledWith(
      "users/user-1/wishlist/wish_loafers01/renders/older.png",
    );
  });
});

describe("WishTryOnPanel", () => {
  it("shows the Premium paywall", () => {
    renderWithProviders(
      <WishTryOnPanel
        wish={mockWishes[0]!}
        prompt="paywall"
        isSubmitting={false}
        entitlement={mockEntitlement}
        onEdit={() => undefined}
        onRetry={() => undefined}
        onDeletePhoto={() => undefined}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    ).toBeInTheDocument();
  });

  it("shows pending progress instead of the result", () => {
    renderWithProviders(
      <WishTryOnPanel
        wish={wishWithHistory}
        prompt="none"
        isSubmitting
        onEdit={() => undefined}
        onRetry={() => undefined}
        onDeletePhoto={() => undefined}
      />,
    );

    expect(
      screen.getByRole("status", { name: "Creating your try-on…" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(VIRTUAL_TRY_ON_RESULT_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it("shows the READY result and older history", () => {
    renderWithProviders(
      <WishTryOnPanel
        wish={wishWithHistory}
        prompt="none"
        isSubmitting={false}
        onEdit={() => undefined}
        onRetry={() => undefined}
        onDeletePhoto={() => undefined}
      />,
    );

    const result = screen.getByRole("region", { name: "Virtual Try On result" });
    expect(
      within(result).getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-started.jpg");
    const gallery = screen.getByRole("region", { name: "Try On photos" });
    expect(
      within(gallery).getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-ivory-maxi-390.jpg");
  });
});
