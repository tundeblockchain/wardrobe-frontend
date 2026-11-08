import { describe, expect, it } from "vitest";
import type { AiProfile } from "./resourceTypes";
import {
  canStartWishTryOn,
  getMissingTryOnDetails,
  getWishTryOnPhotos,
  pickReadyVirtualProfile,
} from "./wishTryOn";
import { mockIncompleteWish, mockWishes, type WishItem } from "./wishlistApi";

const readyPersonal: AiProfile = {
  aiProfileId: "aip_personal01",
  type: "PERSONAL",
  referenceImages: ["users/demo/profiles/personal-front.jpg"],
  status: "READY",
  createdAt: "2026-09-01T12:00:00.000Z",
  updatedAt: "2026-09-01T12:00:00.000Z",
  label: "Weekday look",
};

const readyPreset: AiProfile = {
  aiProfileId: "aip_model01",
  type: "GENERIC_MODEL",
  referenceImages: ["shared/models/catalog-front.jpg"],
  status: "READY",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  label: "Catalog model",
};

const pendingPersonal: AiProfile = {
  ...readyPersonal,
  aiProfileId: "aip_pending",
  status: "PENDING",
};

describe("wish try-on helpers", () => {
  it("requires a photo and a category before generate", () => {
    expect(canStartWishTryOn(mockWishes[0]!)).toBe(true);
    expect(getMissingTryOnDetails(mockWishes[2]!)).toEqual({
      category: false,
      image: true,
    });
    expect(getMissingTryOnDetails(mockIncompleteWish)).toEqual({
      category: true,
      image: true,
    });
    expect(canStartWishTryOn(mockIncompleteWish)).toBe(false);
  });

  it("prefers a READY personal Virtual Profile, then a preset", () => {
    expect(
      pickReadyVirtualProfile([pendingPersonal, readyPreset, readyPersonal])
        ?.aiProfileId,
    ).toBe("aip_personal01");
    expect(pickReadyVirtualProfile([pendingPersonal, readyPreset])?.aiProfileId).toBe(
      "aip_model01",
    );
    expect(pickReadyVirtualProfile([])).toBeUndefined();
  });

  it("maps history, current render, and renderImageUrls into unique photos", () => {
    const wish: WishItem = {
      wishId: "wish_1",
      name: "Coat",
      createdAt: "2026-10-13T12:00:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
      render: {
        status: "READY",
        aiProfileId: "aip_model01",
        imageKey: "users/user-1/wishlist/wish_1/renders/newest.png",
        imageUrl: "/screenshots/try-on-started.jpg",
      },
      renderHistory: [
        {
          imageKey: "users/user-1/wishlist/wish_1/renders/older.png",
          createdAt: "2026-10-01T12:00:00.000Z",
          aiProfileId: "aip_model01",
          imageUrl: "/screenshots/try-on-ivory-maxi-390.jpg",
        },
        {
          imageKey: "users/user-1/wishlist/wish_1/renders/newest.png",
          createdAt: "2026-10-13T12:00:00.000Z",
          aiProfileId: "aip_model01",
          imageUrl: "/screenshots/try-on-started.jpg",
        },
      ],
      renderImageUrls: [
        "/screenshots/try-on-started.jpg",
        "/screenshots/try-on-blue-mini-390.jpg",
      ],
    };

    expect(getWishTryOnPhotos(wish)).toEqual([
      {
        imageUrl: "/screenshots/try-on-started.jpg",
        imageKey: "users/user-1/wishlist/wish_1/renders/newest.png",
      },
      {
        imageUrl: "/screenshots/try-on-ivory-maxi-390.jpg",
        imageKey: "users/user-1/wishlist/wish_1/renders/older.png",
      },
      {
        imageUrl: "/screenshots/try-on-blue-mini-390.jpg",
      },
    ]);
  });
});
