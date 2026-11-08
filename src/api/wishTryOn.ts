import type { AiProfile } from "./resourceTypes";
import {
  getMissingAcquireDetails,
  hasWishImage,
  type MissingAcquireDetails,
  type WishItem,
} from "./wishlistApi";

export type WishTryOnPhoto = {
  imageUrl: string;
  imageKey?: string;
};

export const getMissingTryOnDetails = (
  wish: WishItem,
): MissingAcquireDetails => {
  return getMissingAcquireDetails(wish);
};

export const canStartWishTryOn = (wish: WishItem): boolean => {
  const missing = getMissingTryOnDetails(wish);
  return !missing.category && !missing.image && hasWishImage(wish);
};

export const pickReadyVirtualProfile = (
  profiles: AiProfile[],
): AiProfile | undefined => {
  const ready = profiles.filter((profile) => profile.status === "READY");
  const personal = ready.find(
    (profile) =>
      profile.type === "PERSONAL" && profile.referenceImages.length > 0,
  );
  if (personal) {
    return personal;
  }

  const preset = ready.find((profile) => profile.type === "GENERIC_MODEL");
  if (preset) {
    return preset;
  }

  return ready[0] ?? profiles[0];
};

const readOptionalUrl = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const pushPhoto = (
  photos: WishTryOnPhoto[],
  seen: Set<string>,
  imageUrl?: string,
  imageKey?: string,
) => {
  const url = readOptionalUrl(imageUrl);
  if (!url || seen.has(url)) {
    return;
  }

  seen.add(url);
  const key = imageKey?.trim();
  photos.push(key ? { imageUrl: url, imageKey: key } : { imageUrl: url });
};

export const getWishTryOnPhotos = (wish: WishItem): WishTryOnPhoto[] => {
  const seen = new Set<string>();
  const photos: WishTryOnPhoto[] = [];
  const history = [...(wish.renderHistory ?? [])].sort((left, right) => {
    return right.createdAt.localeCompare(left.createdAt);
  });

  for (const entry of history) {
    pushPhoto(photos, seen, entry.imageUrl, entry.imageKey);
  }

  pushPhoto(photos, seen, wish.render?.imageUrl, wish.render?.imageKey);

  for (const imageUrl of wish.renderImageUrls ?? []) {
    pushPhoto(photos, seen, imageUrl);
  }

  return photos;
};
