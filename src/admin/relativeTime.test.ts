import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./relativeTime";

describe("formatRelativeTime", () => {
  it("formats a timestamp relative to now", () => {
    const nowMs = Date.parse("2026-11-24T12:00:00.000Z");
    expect(formatRelativeTime("2026-11-24T11:00:00.000Z", nowMs)).toBe(
      "1 hour ago",
    );
    expect(formatRelativeTime("2026-11-24T12:00:30.000Z", nowMs)).toBe(
      "in 30 seconds",
    );
  });

  it("returns the original value when the date is invalid", () => {
    expect(formatRelativeTime("not-a-date")).toBe("not-a-date");
  });
});
