import { describe, expect, it } from "vitest";
import { appTheme, wardrobePalette } from "./appTheme";
import {
  contrastRatio,
  isBurgundyPlumHue,
  relativeLuminance,
} from "./colorContrast";

describe("wardrobePalette", () => {
  it("keeps burgundy and plum hues on airy near-white surfaces", () => {
    expect(isBurgundyPlumHue(wardrobePalette.primaryMain)).toBe(true);
    expect(isBurgundyPlumHue(wardrobePalette.secondaryMain)).toBe(true);
    expect(relativeLuminance(wardrobePalette.backgroundDefault)).toBeGreaterThan(
      0.93,
    );
    expect(relativeLuminance(wardrobePalette.backgroundPaper)).toBeGreaterThan(
      relativeLuminance(wardrobePalette.backgroundDefault),
    );
    expect(wardrobePalette.themeColor).toBe(wardrobePalette.backgroundDefault);
  });

  it("meets WCAG AA contrast for body text and accent controls", () => {
    expect(
      contrastRatio(
        wardrobePalette.textPrimary,
        wardrobePalette.backgroundDefault,
      ),
    ).toBeGreaterThanOrEqual(7);
    expect(
      contrastRatio(
        wardrobePalette.textSecondary,
        wardrobePalette.backgroundDefault,
      ),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(
        wardrobePalette.primaryMain,
        wardrobePalette.backgroundPaper,
      ),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(
        wardrobePalette.secondaryMain,
        wardrobePalette.backgroundPaper,
      ),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(
        wardrobePalette.primaryContrast,
        wardrobePalette.primaryMain,
      ),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

describe("appTheme", () => {
  it("exposes the light palette tokens on the MUI theme", () => {
    expect(appTheme.palette.mode).toBe("light");
    expect(appTheme.palette.background.default).toBe(
      wardrobePalette.backgroundDefault,
    );
    expect(appTheme.palette.background.paper).toBe(
      wardrobePalette.backgroundPaper,
    );
    expect(appTheme.palette.primary.main).toBe(wardrobePalette.primaryMain);
    expect(appTheme.palette.secondary.main).toBe(wardrobePalette.secondaryMain);
    expect(appTheme.palette.text.primary).toBe(wardrobePalette.textPrimary);
  });
});
