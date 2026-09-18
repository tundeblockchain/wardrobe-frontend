import { describe, expect, it } from "vitest";
import {
  hexColorsInCss,
  isSoftBlush,
  relativeLuminance,
} from "./colorContrast";
import { wardrobeGradients } from "./wardrobeGradients";
import { wardrobeBlushStops } from "./wardrobePalette";

describe("wardrobeGradients", () => {
  it("uses layered radial and linear blush washes", () => {
    expect(wardrobeGradients.page).toContain("radial-gradient");
    expect(wardrobeGradients.page).toContain("linear-gradient");
    expect(wardrobeGradients.hero).toContain("radial-gradient");
    expect(wardrobeGradients.hero).toContain("linear-gradient");
    expect(wardrobeGradients.blush).toContain("linear-gradient");
    expect(wardrobeGradients.mist).toContain("linear-gradient");
    expect(wardrobeGradients.header).toContain("linear-gradient");
  });

  it("only samples soft pink blush stops", () => {
    const allowedStops = new Set<string>(wardrobeBlushStops);

    for (const gradient of Object.values(wardrobeGradients)) {
      const stops = hexColorsInCss(gradient);
      expect(stops.length).toBeGreaterThan(0);

      for (const stop of stops) {
        expect(allowedStops.has(stop)).toBe(true);
        expect(isSoftBlush(stop)).toBe(true);
        expect(relativeLuminance(stop)).toBeGreaterThan(0.85);
      }
    }
  });
});
