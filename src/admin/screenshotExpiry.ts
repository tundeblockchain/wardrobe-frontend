export const SCREENSHOT_URL_TTL_SECONDS = 900;
export const SCREENSHOT_URL_TTL_MS = SCREENSHOT_URL_TTL_SECONDS * 1000;

export const isScreenshotUrlExpired = (
  fetchedAtMs: number,
  nowMs: number = Date.now(),
): boolean => {
  return nowMs - fetchedAtMs >= SCREENSHOT_URL_TTL_MS;
};

export type ResolveScreenshotUrlInput = {
  fetchedAtMs: number;
  currentUrl: string | null | undefined;
  nowMs?: number;
  refresh: () => Promise<string | null>;
};

export const resolveScreenshotUrlForOpen = async ({
  fetchedAtMs,
  currentUrl,
  nowMs = Date.now(),
  refresh,
}: ResolveScreenshotUrlInput): Promise<string | null> => {
  if (isScreenshotUrlExpired(fetchedAtMs, nowMs)) {
    return refresh();
  }

  return currentUrl ?? null;
};
