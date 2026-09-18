import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  hexColorsInCss,
  hueDegrees,
  isBurgundyPlumHue,
  isSoftBlush,
  relativeLuminance,
  srgbChroma,
} from "./colorContrast";

describe("colorContrast", () => {
  it("treats white as full luminance and black as none", () => {
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  it("classifies the original burgundy-plum hues and rejects unrelated hues", () => {
    expect(hueDegrees("#6B1D3A")).toBeGreaterThan(320);
    expect(isBurgundyPlumHue("#6B1D3A")).toBe(true);
    expect(isBurgundyPlumHue("#7A4A6B")).toBe(true);
    expect(isBurgundyPlumHue("#FFFFFF")).toBe(false);
    expect(isBurgundyPlumHue("#1B7A3A")).toBe(false);
  });

  it("accepts airy pink blush and rejects neon, dark, or original paper", () => {
    expect(isSoftBlush("#FEF7FA")).toBe(true);
    expect(isSoftBlush("#FCEFF4")).toBe(true);
    expect(isSoftBlush("#FFFFFF")).toBe(false);
    expect(isSoftBlush("#FFFCFD")).toBe(false);
    expect(isSoftBlush("#FF1493")).toBe(false);
    expect(isSoftBlush("#3A2430")).toBe(false);
    expect(srgbChroma("#FF1493")).toBeGreaterThan(0.14);
  });

  it("extracts 6-digit hex colors from CSS gradient strings", () => {
    expect(
      hexColorsInCss(
        "linear-gradient(180deg, #F8F3F5 0%, #FFFCFD 100%), radial-gradient(#6B1D3A, transparent)",
      ),
    ).toEqual(["#F8F3F5", "#FFFCFD", "#6B1D3A"]);
  });

  it("rejects hex values that are not 6 digits", () => {
    expect(() => relativeLuminance("#fff")).toThrow(/6-digit hex color/);
  });
});
