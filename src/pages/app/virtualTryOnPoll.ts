import type { ClothingItem, Outfit, OutfitRender } from "../../api/resourceTypes";
import { mapRenderImageUrls } from "../../api/renderImages";

export const VIRTUAL_TRY_ON_POLL_INTERVAL_MS = 2_000;
export const VIRTUAL_TRY_ON_MAX_POLL_ATTEMPTS = 30;

export type PollVirtualTryOnRenderOptions = {
  initial?: OutfitRender;
  intervalMs?: number;
  maxAttempts?: number;
};

const waitForPollInterval = (intervalMs: number): Promise<void> => {
  if (intervalMs <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, intervalMs);
  });
};

export const getVirtualTryOnRenderImageUrl = (
  render: OutfitRender | undefined,
): string | undefined => {
  const trimmed = render?.imageUrl?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed;
};

export const isVirtualTryOnRenderFailed = (
  render: OutfitRender | undefined,
): boolean => {
  return render?.status === "FAILED";
};

export const isVirtualTryOnRenderReady = (
  render: OutfitRender | undefined,
): boolean => {
  return (
    render?.status === "READY" &&
    Boolean(getVirtualTryOnRenderImageUrl(render))
  );
};

const isOutfitRender = (
  source: ClothingItem | Outfit | OutfitRender,
): source is OutfitRender => {
  return "status" in source && !("wardrobeId" in source);
};

export const collectVirtualTryOnImageUrls = (
  source: ClothingItem | Outfit | OutfitRender,
): string[] => {
  if (isOutfitRender(source)) {
    const imageUrl = getVirtualTryOnRenderImageUrl(source);
    return imageUrl ? [imageUrl] : [];
  }

  return mapRenderImageUrls(source);
};

export const pollVirtualTryOnRender = async (
  getRender: () => Promise<OutfitRender>,
  options: PollVirtualTryOnRenderOptions = {},
): Promise<OutfitRender> => {
  const intervalMs = options.intervalMs ?? VIRTUAL_TRY_ON_POLL_INTERVAL_MS;
  const maxAttempts = options.maxAttempts ?? VIRTUAL_TRY_ON_MAX_POLL_ATTEMPTS;
  let latest = options.initial;

  if (
    isVirtualTryOnRenderReady(latest) ||
    isVirtualTryOnRenderFailed(latest)
  ) {
    return latest as OutfitRender;
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0 || latest) {
      await waitForPollInterval(intervalMs);
    }

    latest = await getRender();
    if (
      isVirtualTryOnRenderReady(latest) ||
      isVirtualTryOnRenderFailed(latest)
    ) {
      return latest;
    }
  }

  throw new Error("Virtual Try On is still processing.");
};

export const resolveVirtualTryOnImageUrls = async (
  posted: ClothingItem | Outfit,
  getRender: () => Promise<OutfitRender>,
  options: PollVirtualTryOnRenderOptions = {},
): Promise<string[]> => {
  const postedUrls = collectVirtualTryOnImageUrls(posted);
  if (postedUrls.length > 0) {
    return postedUrls;
  }

  const render = await pollVirtualTryOnRender(getRender, {
    ...options,
    initial: posted.render,
  });

  if (isVirtualTryOnRenderFailed(render)) {
    throw new Error(
      render.error?.trim() || "Virtual Try On could not be created.",
    );
  }

  return collectVirtualTryOnImageUrls(render);
};
