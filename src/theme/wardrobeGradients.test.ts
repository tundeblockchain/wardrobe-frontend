import { describe, expect, it } from "vitest";
import { hexColorsInCss, isSoftBlush } from "./colorContrast";
import { wardrobeGradients } from "./wardrobeGradients";

describe("wardrobeGradients", () => {
  it("does not paint pink blush washes on named surfaces", () => {
    for (const gradient of Object.values(wardrobeGradients)) {
      expect(gradient).toBe("none");
      expect(gradient).not.toContain("radial-gradient");
      expect(gradient).not.toContain("linear-gradient");
      expect(hexColorsInCss(gradient)).toEqual([]);
    }
  });

  it("rejects the retired 110 blush stops", () => {
    const retiredBlushStops = ["#FFF8FB", "#FEF7FA", "#FCEFF4", "#FBEAF1"];

    for (const blushStop of retiredBlushStops) {
      expect(isSoftBlush(blushStop)).toBe(true);
    }

    const serialized = Object.values(wardrobeGradients).join(" ");
    for (const blushStop of retiredBlushStops) {
      expect(serialized).not.toContain(blushStop);
    }
  });
});
