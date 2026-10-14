import { afterEach, describe, expect, it } from "vitest";
import {
  THEME_PREFERENCE_STORAGE_KEY,
  readThemePreference,
  resolveThemeMode,
  writeThemePreference,
} from "./themePreference";

describe("themePreference", () => {
  afterEach(() => {
    window.localStorage.removeItem(THEME_PREFERENCE_STORAGE_KEY);
  });

  it("defaults to system and persists a valid preference", () => {
    expect(readThemePreference()).toBe("system");
    writeThemePreference("dark");
    expect(readThemePreference()).toBe("dark");
    window.localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, "nope");
    expect(readThemePreference()).toBe("system");
  });

  it("resolves system to the current color scheme", () => {
    expect(resolveThemeMode("system", true)).toBe("dark");
    expect(resolveThemeMode("system", false)).toBe("light");
    expect(resolveThemeMode("light", true)).toBe("light");
    expect(resolveThemeMode("dark", false)).toBe("dark");
  });
});
