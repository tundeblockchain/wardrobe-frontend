import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/httpClient";
import {
  createAiTryOnOffResourceApi,
  createMockResourceApi,
  mockAiProfiles,
} from "../api/mockResourceApi";
import type { ResourceApi } from "../api/resourceApi";
import type { OutfitRender } from "../api/resourceTypes";
import { ENTITLEMENT_AI_REQUIRED_CODE } from "../api/resourceTypes";
import {
  AI_PROFILE_NOT_FOUND_CODE,
  createMockWishlistApi,
  mockIncompleteWish,
  mockWishes,
  WISH_CATEGORY_REQUIRED_CODE,
  WISH_IMAGE_REQUIRED_CODE,
  type WishItem,
  type WishlistApi,
} from "../api/wishlistApi";
import { renderWithProviders } from "../test/renderWithProviders";
import { useWishTryOn } from "./useWishTryOn";

const loafer = mockWishes[0]!;

const TryOnProbe = ({
  wish,
  wishlistApi,
  resourceApi,
}: {
  wish: WishItem;
  wishlistApi: WishlistApi;
  resourceApi: ResourceApi;
}) => {
  const tryOn = useWishTryOn({
    wish,
    wishlistApi,
    resourceApi,
    pollIntervalMs: 0,
    maxPollAttempts: 4,
  });

  return (
    <div>
      <p data-testid="prompt">{tryOn.prompt}</p>
      <p data-testid="failed">{tryOn.failedMessage ?? ""}</p>
      <p data-testid="submitting">{String(tryOn.isSubmitting)}</p>
      <button
        type="button"
        onClick={() => {
          void tryOn.handleTryOn();
        }}
      >
        Start try on
      </button>
      <button type="button" onClick={tryOn.handleRetry}>
        Retry try on
      </button>
      <button
        type="button"
        onClick={() => {
          void tryOn.handleDeletePhoto("users/user-1/wishlist/wish_loafers01/renders/a.png");
        }}
      >
        Delete photo
      </button>
    </div>
  );
};

const renderHookUi = (
  wishlistApi: WishlistApi,
  resourceApi: ResourceApi = createMockResourceApi(),
  wish: WishItem = loafer,
) => {
  return renderWithProviders(
    <TryOnProbe
      wish={wish}
      wishlistApi={wishlistApi}
      resourceApi={resourceApi}
    />,
    { auth: { user: { id: "user-1", email: "user@example.com" } } },
  );
};

describe("useWishTryOn", () => {
  it("does not POST when the wish has no photo", async () => {
    const user = userEvent.setup();
    const renderWish = vi.fn();
    renderHookUi(
      createMockWishlistApi({ renderWish }, { wishes: [mockWishes[2]!] }),
      createMockResourceApi(),
      mockWishes[2]!,
    );

    await user.click(screen.getByRole("button", { name: "Start try on" }));

    expect(screen.getByTestId("prompt")).toHaveTextContent("missing-image");
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
    renderHookUi(createMockWishlistApi({ renderWish }, { wishes: [wish] }), createMockResourceApi(), wish);

    await user.click(screen.getByRole("button", { name: "Start try on" }));

    expect(screen.getByTestId("prompt")).toHaveTextContent("missing-category");
    expect(renderWish).not.toHaveBeenCalled();
  });

  it("does not POST when the wish is missing both a photo and a category", async () => {
    const user = userEvent.setup();
    const renderWish = vi.fn();
    renderHookUi(
      createMockWishlistApi({ renderWish }, { wishes: [mockIncompleteWish] }),
      createMockResourceApi(),
      mockIncompleteWish,
    );

    await user.click(screen.getByRole("button", { name: "Start try on" }));

    expect(screen.getByTestId("prompt")).toHaveTextContent("missing-both");
    expect(renderWish).not.toHaveBeenCalled();
  });

  it("shows the Premium paywall when aiTryOn is off without posting", async () => {
    const user = userEvent.setup();
    const renderWish = vi.fn();
    renderHookUi(
      createMockWishlistApi({ renderWish }),
      createAiTryOnOffResourceApi(),
    );

    await user.click(screen.getByRole("button", { name: "Start try on" }));

    await waitFor(() => {
      expect(screen.getByTestId("prompt")).toHaveTextContent("paywall");
    });
    expect(renderWish).not.toHaveBeenCalled();
  });

  it("maps 403 ENTITLEMENT_AI_REQUIRED from generate to the paywall", async () => {
    const user = userEvent.setup();
    const renderWish = vi.fn().mockRejectedValue(
      new ApiError({
        status: 403,
        code: ENTITLEMENT_AI_REQUIRED_CODE,
        message: "Premium is required for Virtual Try On.",
      }),
    );
    renderHookUi(createMockWishlistApi({ renderWish }));

    await user.click(screen.getByRole("button", { name: "Start try on" }));

    await waitFor(() => {
      expect(screen.getByTestId("prompt")).toHaveTextContent("paywall");
    });
    expect(renderWish).toHaveBeenCalledWith("wish_loafers01", {
      aiProfileId: mockAiProfiles[0]!.aiProfileId,
    });
  });

  it("maps WISH_IMAGE_REQUIRED from the server to the photo prompt", async () => {
    const user = userEvent.setup();
    const renderWish = vi.fn().mockRejectedValue(
      new ApiError({
        status: 400,
        code: WISH_IMAGE_REQUIRED_CODE,
        message: "Wish needs a photo.",
      }),
    );
    renderHookUi(createMockWishlistApi({ renderWish }));

    await user.click(screen.getByRole("button", { name: "Start try on" }));

    await waitFor(() => {
      expect(screen.getByTestId("prompt")).toHaveTextContent("missing-image");
    });
  });

  it("maps WISH_CATEGORY_REQUIRED from the server to the category prompt", async () => {
    const user = userEvent.setup();
    const renderWish = vi.fn().mockRejectedValue(
      new ApiError({
        status: 400,
        code: WISH_CATEGORY_REQUIRED_CODE,
        message: "Wish needs a category.",
      }),
    );
    renderHookUi(createMockWishlistApi({ renderWish }));

    await user.click(screen.getByRole("button", { name: "Start try on" }));

    await waitFor(() => {
      expect(screen.getByTestId("prompt")).toHaveTextContent("missing-category");
    });
  });

  it("maps AI_PROFILE_NOT_FOUND to the profile setup prompt", async () => {
    const user = userEvent.setup();
    const renderWish = vi.fn().mockRejectedValue(
      new ApiError({
        status: 404,
        code: AI_PROFILE_NOT_FOUND_CODE,
        message: "Virtual Profile not found.",
      }),
    );
    renderHookUi(createMockWishlistApi({ renderWish }));

    await user.click(screen.getByRole("button", { name: "Start try on" }));

    await waitFor(() => {
      expect(screen.getByTestId("prompt")).toHaveTextContent("missing-profile");
    });
  });

  it("prompts to set up a profile when none are listed", async () => {
    const user = userEvent.setup();
    const renderWish = vi.fn();
    renderHookUi(
      createMockWishlistApi({ renderWish }),
      createMockResourceApi(
        {},
        { aiProfiles: [] },
      ),
    );

    await user.click(screen.getByRole("button", { name: "Start try on" }));

    await waitFor(() => {
      expect(screen.getByTestId("prompt")).toHaveTextContent("missing-profile");
    });
    expect(renderWish).not.toHaveBeenCalled();
  });

  it("polls until READY and never sends an image URL", async () => {
    const user = userEvent.setup();
    const pendingWish: WishItem = {
      ...loafer,
      render: { status: "PENDING", aiProfileId: "aip_personal01" },
    };
    const readyWish: WishItem = {
      ...loafer,
      render: {
        status: "READY",
        aiProfileId: "aip_personal01",
        imageKey: "users/user-1/wishlist/wish_loafers01/renders/a.png",
        imageUrl: "/screenshots/try-on-started.jpg",
      },
      renderHistory: [
        {
          imageKey: "users/user-1/wishlist/wish_loafers01/renders/a.png",
          createdAt: "2026-10-13T12:00:00.000Z",
          aiProfileId: "aip_personal01",
          imageUrl: "/screenshots/try-on-started.jpg",
        },
      ],
    };
    const renderWish = vi.fn().mockResolvedValue(pendingWish);
    const getWishRender = vi
      .fn()
      .mockResolvedValueOnce({
        status: "PROCESSING",
        aiProfileId: "aip_personal01",
      } satisfies OutfitRender)
      .mockResolvedValueOnce({
        status: "READY",
        aiProfileId: "aip_personal01",
        imageUrl: "/screenshots/try-on-started.jpg",
      } satisfies OutfitRender);
    const getWish = vi.fn().mockResolvedValue(readyWish);
    renderHookUi(
      createMockWishlistApi({ renderWish, getWishRender, getWish }),
    );

    await user.click(screen.getByRole("button", { name: "Start try on" }));

    await waitFor(() => {
      expect(screen.getByTestId("prompt")).toHaveTextContent("none");
      expect(screen.getByTestId("submitting")).toHaveTextContent("false");
    });
    expect(renderWish).toHaveBeenCalledWith("wish_loafers01", {
      aiProfileId: "aip_personal01",
    });
    expect(JSON.stringify(renderWish.mock.calls[0]?.[1])).not.toMatch(
      /imageUrl|originalImageUrl/,
    );
    expect(getWishRender).toHaveBeenCalled();
    expect(getWish).toHaveBeenCalledWith("wish_loafers01");
  });

  it("shows FAILED with retry and retries generate", async () => {
    const user = userEvent.setup();
    const renderWish = vi
      .fn()
      .mockResolvedValueOnce({
        ...loafer,
        render: { status: "PENDING", aiProfileId: "aip_personal01" },
      })
      .mockResolvedValueOnce({
        ...loafer,
        render: {
          status: "READY",
          aiProfileId: "aip_personal01",
          imageUrl: "/screenshots/try-on-started.jpg",
        },
      });
    const getWishRender = vi.fn().mockResolvedValueOnce({
      status: "FAILED",
      aiProfileId: "aip_personal01",
      error: "The Virtual Try On render could not be created.",
    });
    renderHookUi(createMockWishlistApi({ renderWish, getWishRender }));

    await user.click(screen.getByRole("button", { name: "Start try on" }));

    await waitFor(() => {
      expect(screen.getByTestId("prompt")).toHaveTextContent("failed");
    });
    expect(screen.getByTestId("failed")).toHaveTextContent(
      "The Virtual Try On render could not be created.",
    );

    await user.click(screen.getByRole("button", { name: "Retry try on" }));

    await waitFor(() => {
      expect(renderWish).toHaveBeenCalledTimes(2);
    });
  });

  it("keeps polling after 404 RENDER_NOT_FOUND", async () => {
    const user = userEvent.setup();
    const renderWish = vi.fn().mockResolvedValue({
      ...loafer,
      render: { status: "PENDING", aiProfileId: "aip_personal01" },
    });
    const getWishRender = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({
          status: 404,
          code: "RENDER_NOT_FOUND",
          message: "Virtual Try On is not ready yet.",
        }),
      )
      .mockResolvedValueOnce({
        status: "READY",
        aiProfileId: "aip_personal01",
        imageUrl: "/screenshots/try-on-started.jpg",
      });
    const getWish = vi.fn().mockResolvedValue({
      ...loafer,
      render: {
        status: "READY",
        aiProfileId: "aip_personal01",
        imageUrl: "/screenshots/try-on-started.jpg",
      },
    });
    renderHookUi(
      createMockWishlistApi({ renderWish, getWishRender, getWish }),
    );

    await user.click(screen.getByRole("button", { name: "Start try on" }));

    await waitFor(() => {
      expect(getWishRender).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("prompt")).toHaveTextContent("none");
    });
  });

  it("deletes a Try On photo by imageKey", async () => {
    const user = userEvent.setup();
    const deleteWishRender = vi.fn().mockResolvedValue(undefined);
    const getWish = vi.fn().mockResolvedValue(loafer);
    renderHookUi(createMockWishlistApi({ deleteWishRender, getWish }));

    await user.click(screen.getByRole("button", { name: "Delete photo" }));

    await waitFor(() => {
      expect(deleteWishRender).toHaveBeenCalledWith("wish_loafers01", {
        imageKey: "users/user-1/wishlist/wish_loafers01/renders/a.png",
      });
    });
  });
});
