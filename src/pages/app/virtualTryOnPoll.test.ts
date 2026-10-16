import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/httpClient";
import type { ClothingItem, OutfitRender } from "../../api/resourceTypes";
import {
  RENDER_NOT_FOUND_CODE,
  isVirtualTryOnRenderFailed,
  isVirtualTryOnRenderInProgress,
  isVirtualTryOnRenderNotFound,
  isVirtualTryOnRenderReady,
  pollVirtualTryOnRender,
  resolveVirtualTryOnImageUrls,
} from "./virtualTryOnPoll";

const pendingRender: OutfitRender = {
  status: "PENDING",
  aiProfileId: "aip_personal01",
};

const processingRender: OutfitRender = {
  status: "PROCESSING",
  aiProfileId: "aip_personal01",
};

const readyWithoutImage: OutfitRender = {
  status: "READY",
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
  it("treats PENDING and PROCESSING as in progress", () => {
    expect(isVirtualTryOnRenderInProgress(pendingRender)).toBe(true);
    expect(isVirtualTryOnRenderInProgress(processingRender)).toBe(true);
    expect(isVirtualTryOnRenderInProgress(readyWithoutImage)).toBe(false);
    expect(isVirtualTryOnRenderInProgress(readyRender)).toBe(false);
    expect(isVirtualTryOnRenderReady(pendingRender)).toBe(false);
    expect(isVirtualTryOnRenderReady(processingRender)).toBe(false);
  });

  it("treats READY renders with an image as complete", () => {
    expect(isVirtualTryOnRenderReady(readyRender)).toBe(true);
    expect(isVirtualTryOnRenderReady(readyWithoutImage)).toBe(false);
    expect(
      isVirtualTryOnRenderFailed({ ...pendingRender, status: "FAILED" }),
    ).toBe(true);
  });

  it("returns an already-ready render without polling", async () => {
    const getRender = vi.fn();

    await expect(
      pollVirtualTryOnRender(getRender, { initial: readyRender }),
    ).resolves.toEqual(readyRender);
    expect(getRender).not.toHaveBeenCalled();
  });

  it("polls GET /render through PENDING and PROCESSING until READY with imageUrl", async () => {
    const getRender = vi
      .fn()
      .mockResolvedValueOnce(processingRender)
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

  it("re-fetches when status is READY but imageUrl is missing", async () => {
    const getRender = vi
      .fn()
      .mockResolvedValueOnce(readyWithoutImage)
      .mockResolvedValueOnce(readyRender);

    await expect(
      pollVirtualTryOnRender(getRender, {
        initial: readyWithoutImage,
        intervalMs: 0,
        maxAttempts: 4,
      }),
    ).resolves.toEqual(readyRender);
    expect(getRender).toHaveBeenCalledTimes(2);
  });

  it("keeps polling after 404 RENDER_NOT_FOUND", async () => {
    const getRender = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({
          status: 404,
          code: RENDER_NOT_FOUND_CODE,
          message: "Virtual Try On is not ready yet.",
        }),
      )
      .mockResolvedValueOnce(readyRender);

    expect(
      isVirtualTryOnRenderNotFound(
        new ApiError({
          status: 404,
          code: RENDER_NOT_FOUND_CODE,
          message: "Virtual Try On is not ready yet.",
        }),
      ),
    ).toBe(true);

    await expect(
      pollVirtualTryOnRender(getRender, {
        intervalMs: 0,
        maxAttempts: 4,
      }),
    ).resolves.toEqual(readyRender);
    expect(getRender).toHaveBeenCalledTimes(2);
  });

  it("uses render.imageUrl only when the posted render is READY", async () => {
    const getRender = vi.fn();

    await expect(
      resolveVirtualTryOnImageUrls(
        { ...postedItem, render: readyRender },
        getRender,
      ),
    ).resolves.toEqual(["/screenshots/try-on-started.jpg"]);
    expect(getRender).not.toHaveBeenCalled();
  });

  it("does not treat historical renderImageUrls as the current result", async () => {
    const getRender = vi.fn().mockResolvedValue(readyRender);

    await expect(
      resolveVirtualTryOnImageUrls(
        {
          ...postedItem,
          renderImageUrls: ["/screenshots/try-on-ivory-maxi-390.jpg"],
          render: pendingRender,
        },
        getRender,
        { intervalMs: 0, maxAttempts: 2 },
      ),
    ).resolves.toEqual(["/screenshots/try-on-started.jpg"]);
    expect(getRender).toHaveBeenCalledTimes(1);
  });

  it("surfaces render.error when status is FAILED", async () => {
    const getRender = vi.fn().mockResolvedValue({
      status: "FAILED",
      aiProfileId: "aip_personal01",
      error: "The Virtual Try On render could not be created.",
    });

    await expect(
      resolveVirtualTryOnImageUrls(postedItem, getRender, {
        intervalMs: 0,
        maxAttempts: 2,
      }),
    ).rejects.toThrow("The Virtual Try On render could not be created.");
  });
});
