import { describe, expect, it, vi } from "vitest";
import type { ClothingItem, OutfitRender } from "../../api/resourceTypes";
import {
  collectVirtualTryOnImageUrls,
  isVirtualTryOnRenderFailed,
  isVirtualTryOnRenderReady,
  pollVirtualTryOnRender,
  resolveVirtualTryOnImageUrls,
} from "./virtualTryOnPoll";

const pendingRender: OutfitRender = {
  status: "PENDING",
  aiProfileId: "aip_personal01",
};

const readyRender: OutfitRender = {
  status: "READY",
  aiProfileId: "aip_personal01",
  imageUrl: "/screenshots/try-on-started.jpg",
};

const postedItem: ClothingItem = {
  itemId: "item_navytee01",
  wardrobeId: "wd_weekend01",
  name: "Navy tee",
  category: "TOP",
  processingStatus: "READY",
  createdAt: "2026-09-03T18:40:00.000Z",
  updatedAt: "2026-10-13T12:00:00.000Z",
  render: pendingRender,
};

describe("virtualTryOnPoll", () => {
  it("treats READY renders with an image as complete", () => {
    expect(isVirtualTryOnRenderReady(readyRender)).toBe(true);
    expect(isVirtualTryOnRenderReady(pendingRender)).toBe(false);
    expect(isVirtualTryOnRenderFailed({ ...pendingRender, status: "FAILED" })).toBe(
      true,
    );
    expect(collectVirtualTryOnImageUrls(readyRender)).toEqual([
      "/screenshots/try-on-started.jpg",
    ]);
  });

  it("returns an already-ready render without polling", async () => {
    const getRender = vi.fn();

    await expect(
      pollVirtualTryOnRender(getRender, { initial: readyRender }),
    ).resolves.toEqual(readyRender);
    expect(getRender).not.toHaveBeenCalled();
  });

  it("polls getItemRender until the image is ready", async () => {
    const getRender = vi
      .fn()
      .mockResolvedValueOnce({ status: "PROCESSING", aiProfileId: "aip_personal01" })
      .mockResolvedValueOnce(readyRender);

    await expect(
      pollVirtualTryOnRender(getRender, {
        initial: pendingRender,
        intervalMs: 0,
        maxAttempts: 4,
      }),
    ).resolves.toEqual(readyRender);
    expect(getRender).toHaveBeenCalledTimes(2);
  });

  it("reuses posted image URLs and otherwise polls until ready", async () => {
    const getRender = vi.fn().mockResolvedValue(readyRender);

    await expect(
      resolveVirtualTryOnImageUrls(
        {
          ...postedItem,
          renderImageUrls: ["/screenshots/try-on-started.jpg"],
        },
        getRender,
      ),
    ).resolves.toEqual(["/screenshots/try-on-started.jpg"]);
    expect(getRender).not.toHaveBeenCalled();

    await expect(
      resolveVirtualTryOnImageUrls(postedItem, getRender, {
        intervalMs: 0,
        maxAttempts: 2,
      }),
    ).resolves.toEqual(["/screenshots/try-on-started.jpg"]);
    expect(getRender).toHaveBeenCalledTimes(1);
  });
});
