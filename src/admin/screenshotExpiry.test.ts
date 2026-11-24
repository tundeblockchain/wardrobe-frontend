import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isScreenshotUrlExpired,
  resolveScreenshotUrlForOpen,
  SCREENSHOT_URL_TTL_MS,
} from "./screenshotExpiry";

describe("screenshot URL expiry", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is not expired before 900 seconds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const fetchedAtMs = Date.now();
    vi.setSystemTime(new Date("2026-01-01T00:14:59.999Z"));

    expect(isScreenshotUrlExpired(fetchedAtMs)).toBe(false);
  });

  it("expires at 900 seconds and refreshes before open", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const fetchedAtMs = Date.now();
    const currentUrl = "https://cdn.example.com/shot-v1.png";
    const refresh = vi.fn(async () => "https://cdn.example.com/shot-v2.png");

    await expect(
      resolveScreenshotUrlForOpen({
        fetchedAtMs,
        currentUrl,
        refresh,
      }),
    ).resolves.toBe(currentUrl);
    expect(refresh).not.toHaveBeenCalled();

    vi.advanceTimersByTime(SCREENSHOT_URL_TTL_MS);

    await expect(
      resolveScreenshotUrlForOpen({
        fetchedAtMs,
        currentUrl,
        refresh,
      }),
    ).resolves.toBe("https://cdn.example.com/shot-v2.png");
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
