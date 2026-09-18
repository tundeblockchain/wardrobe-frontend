import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  hueDegrees,
  isBurgundyPlumHue,
  relativeLuminance,
} from "./colorContrast";

describe("colorContrast", () => {
  it("treats white as full luminance and black as none", () => {
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  it("classifies burgundy-plum hues and rejects unrelated hues", () => {
    expect(hueDegrees("#8A3554")).toBeGreaterThan(320);
    expect(isBurgundyPlumHue("#8A3554")).toBe(true);
    expect(isBurgundyPlumHue("#FFFFFF")).toBe(false);
    expect(isBurgundyPlumHue("#1B7A3A")).toBe(false);
  });

  it("rejects hex values that are not 6 digits", () => {
    expect(() => relativeLuminance("#fff")).toThrow(/6-digit hex color/);
  });
});
