import { isApiError } from "../../api/httpClient";
import type { ClothingItem, Outfit, OutfitRender } from "../../api/resourceTypes";

export const VIRTUAL_TRY_ON_POLL_INTERVAL_MS = 2_000;
export const VIRTUAL_TRY_ON_MAX_POLL_ATTEMPTS = 30;
export const RENDER_NOT_FOUND_CODE = "RENDER_NOT_FOUND";

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

export const isVirtualTryOnRenderInProgress = (
  render: OutfitRender | undefined,
): boolean => {
  return render?.status === "PENDING" || render?.status === "PROCESSING";
};

export const isVirtualTryOnRenderReady = (
  render: OutfitRender | undefined,
): boolean => {
  return (
    render?.status === "READY" &&
    Boolean(getVirtualTryOnRenderImageUrl(render))
  );
};

export const isVirtualTryOnRenderNotFound = (error: unknown): boolean => {
  return (
    isApiError(error) &&
    error.status === 404 &&
    error.code === RENDER_NOT_FOUND_CODE
  );
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

    try {
      latest = await getRender();
    } catch (error) {
      if (!isVirtualTryOnRenderNotFound(error)) {
        throw error;
      }

      continue;
    }

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
  if (isVirtualTryOnRenderReady(posted.render)) {
    const postedUrl = getVirtualTryOnRenderImageUrl(posted.render);
    return postedUrl ? [postedUrl] : [];
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

  const imageUrl = getVirtualTryOnRenderImageUrl(render);
  return imageUrl ? [imageUrl] : [];
};
