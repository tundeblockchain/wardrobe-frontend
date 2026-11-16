import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockResourceApi } from "../../api/mockResourceApi";
import {
  createMockWishlistApi,
  mockIncompleteWish,
  mockWishes,
  type WishItem,
} from "../../api/wishlistApi";
import { renderWithProviders } from "../../test/renderWithProviders";
import { WishListDetailDialog } from "./WishListDetailDialog";

vi.mock("../../config/trackingEvents", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../config/trackingEvents")>();
  return {
    ...actual,
    trackEvent: vi.fn(),
  };
});

import { trackEvent } from "../../config/trackingEvents";

const mockedTrackEvent = vi.mocked(trackEvent);

const renderDialog = (wish: WishItem) => {
  return renderWithProviders(
    <WishListDetailDialog
      wish={wish}
      wishlistApi={createMockWishlistApi()}
      resourceApi={createMockResourceApi()}
      onClose={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onAcquire={vi.fn()}
    />,
  );
};

const RefetchHost = ({ wish }: { wish: WishItem }) => {
  const [currentWish, setCurrentWish] = useState(wish);

  const handleRefresh = () => {
    setCurrentWish({
      ...currentWish,
      notes: "Updated from a refetch",
    });
  };

  return (
    <>
      <button type="button" onClick={handleRefresh}>
        Refresh wish
      </button>
      <WishListDetailDialog
        wish={currentWish}
        wishlistApi={createMockWishlistApi()}
        resourceApi={createMockResourceApi()}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onAcquire={vi.fn()}
      />
    </>
  );
};

const expectViewWishCalls = () => {
  return mockedTrackEvent.mock.calls.filter((call) => call[0] === "view_wish");
};

describe("WishListDetailDialog tracking", () => {
  beforeEach(() => {
    mockedTrackEvent.mockClear();
  });

  afterEach(() => {
    mockedTrackEvent.mockClear();
  });

  it("fires view_wish once with content_type and category, and no PII", async () => {
    renderDialog(mockWishes[0]!);

    expect(
      await screen.findByRole("heading", { name: "Black loafers" }),
    ).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(expectViewWishCalls()).toHaveLength(1);
    });
    expect(expectViewWishCalls()[0]?.[1]).toEqual({
      content_type: "wish",
      category: "SHOES",
    });
    expect(JSON.stringify(expectViewWishCalls())).not.toMatch(
      /Black loafers|person@|wish_loafers01|https:\/\/|\/screenshots\//,
    );
  });

  it("omits category when the wish does not have one", async () => {
    renderDialog(mockIncompleteWish);

    expect(
      await screen.findByRole("heading", { name: "Linen shirt" }),
    ).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(expectViewWishCalls()).toHaveLength(1);
    });
    expect(expectViewWishCalls()[0]?.[1]).toEqual({ content_type: "wish" });
  });

  it("fires a second view_wish after close and open of the same wish", async () => {
    const first = renderDialog(mockWishes[0]!);
    await vi.waitFor(() => {
      expect(expectViewWishCalls()).toHaveLength(1);
    });
    first.unmount();

    renderDialog(mockWishes[0]!);
    await vi.waitFor(() => {
      expect(expectViewWishCalls()).toHaveLength(2);
    });
    expect(expectViewWishCalls()[1]?.[1]).toEqual({
      content_type: "wish",
      category: "SHOES",
    });
  });

  it("does not fire again when wish data is refreshed while the dialog stays mounted", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RefetchHost wish={mockWishes[0]!} />);

    await vi.waitFor(() => {
      expect(expectViewWishCalls()).toHaveLength(1);
    });
    await user.click(
      screen.getByRole("button", { name: "Refresh wish", hidden: true }),
    );
    expect(screen.getByText("Updated from a refetch")).toBeInTheDocument();
    await Promise.resolve();
    expect(expectViewWishCalls()).toHaveLength(1);
  });

  it("does not fire view_try_on when the wish detail dialog loads Try On data", async () => {
    renderDialog(mockWishes[0]!);

    expect(
      await screen.findByRole("button", { name: "Virtual Try On this wish" }),
    ).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(expectViewWishCalls()).toHaveLength(1);
    });
    expect(
      mockedTrackEvent.mock.calls.filter((call) => call[0] === "view_try_on"),
    ).toHaveLength(0);
  });
});
