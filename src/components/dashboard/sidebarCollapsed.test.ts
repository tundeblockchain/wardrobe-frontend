import { afterEach, describe, expect, it } from "vitest";
import {
  readSidebarCollapsed,
  SIDEBAR_COLLAPSED_STORAGE_KEY,
  writeSidebarCollapsed,
} from "./sidebarCollapsed";

describe("sidebarCollapsed", () => {
  afterEach(() => {
    window.localStorage.removeItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
  });

  it("defaults to expanded when nothing is stored", () => {
    expect(readSidebarCollapsed()).toBe(false);
  });

  it("persists collapsed state in localStorage", () => {
    writeSidebarCollapsed(true);

    expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe(
      "true",
    );
    expect(readSidebarCollapsed()).toBe(true);

    writeSidebarCollapsed(false);

    expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe(
      "false",
    );
    expect(readSidebarCollapsed()).toBe(false);
  });
});
