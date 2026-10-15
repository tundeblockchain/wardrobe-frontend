import { describe, expect, it } from "vitest";
import {
  canSelectVirtualProfile,
  hasVirtualTryOnClothingSelection,
} from "./virtualTryOnPickOrder";

describe("virtualTryOnPickOrder", () => {
  it("requires clothing items before a Virtual Profile can be selected", () => {
    expect(hasVirtualTryOnClothingSelection("items", [], "")).toBe(false);
    expect(canSelectVirtualProfile("items", [], "")).toBe(false);
    expect(
      hasVirtualTryOnClothingSelection("items", ["item_navytee01"], ""),
    ).toBe(true);
    expect(
      canSelectVirtualProfile("items", ["item_navytee01"], ""),
    ).toBe(true);
  });

  it("requires an outfit before a Virtual Profile can be selected", () => {
    expect(hasVirtualTryOnClothingSelection("outfit", [], "")).toBe(false);
    expect(canSelectVirtualProfile("outfit", ["item_navytee01"], "")).toBe(
      false,
    );
    expect(
      hasVirtualTryOnClothingSelection("outfit", [], "outfit_brunch01"),
    ).toBe(true);
    expect(
      canSelectVirtualProfile("outfit", [], "outfit_brunch01"),
    ).toBe(true);
  });
});
