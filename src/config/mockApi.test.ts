import { describe, expect, it } from "vitest";
import { isMockApi } from "./mockApi";

describe("isMockApi", () => {
  it("defaults to false when the env value is missing or blank", () => {
    expect(isMockApi({})).toBe(false);
    expect(isMockApi({ VITE_USE_MOCK_API: "" })).toBe(false);
    expect(isMockApi({ VITE_USE_MOCK_API: "   " })).toBe(false);
  });

  it("treats true and 1 as enabled", () => {
    expect(isMockApi({ VITE_USE_MOCK_API: "true" })).toBe(true);
    expect(isMockApi({ VITE_USE_MOCK_API: " TRUE " })).toBe(true);
    expect(isMockApi({ VITE_USE_MOCK_API: "1" })).toBe(true);
  });

  it("treats other values as disabled", () => {
    expect(isMockApi({ VITE_USE_MOCK_API: "false" })).toBe(false);
    expect(isMockApi({ VITE_USE_MOCK_API: "0" })).toBe(false);
    expect(isMockApi({ VITE_USE_MOCK_API: "yes" })).toBe(false);
  });
});
