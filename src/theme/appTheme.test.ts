import { describe, expect, it } from "vitest";
import { appTheme, wardrobeBlushStops, wardrobePalette } from "./appTheme";
import { wardrobeGradients } from "./wardrobeGradients";
import {
  contrastRatio,
  isBurgundyPlumHue,
  isSoftBlush,
  relativeLuminance,
} from "./colorContrast";

describe("wardrobePalette", () => {
  it("keeps burgundy and plum hues on airy blush surfaces", () => {
    expect(isBurgundyPlumHue(wardrobePalette.primaryMain)).toBe(true);
    expect(isBurgundyPlumHue(wardrobePalette.secondaryMain)).toBe(true);
    expect(relativeLuminance(wardrobePalette.backgroundDefault)).toBeGreaterThan(
      0.93,
    );
    expect(relativeLuminance(wardrobePalette.backgroundPaper)).toBeGreaterThan(
      relativeLuminance(wardrobePalette.backgroundDefault),
    );
    expect(wardrobePalette.themeColor).toBe(wardrobePalette.backgroundDefault);
    expect(wardrobePalette.backgroundDefault).toBe(wardrobePalette.blushCanvas);
    expect(wardrobePalette.backgroundPaper).toBe(wardrobePalette.blushPetal);
  });

  it("uses soft pink blush stops that stay airy rather than neon or dark", () => {
    expect(wardrobeBlushStops).toEqual([
      wardrobePalette.blushPetal,
      wardrobePalette.blushCanvas,
      wardrobePalette.blushWash,
      wardrobePalette.blushMist,
    ]);

    for (const blushStop of wardrobeBlushStops) {
      expect(isSoftBlush(blushStop)).toBe(true);
      expect(relativeLuminance(blushStop)).toBeGreaterThan(0.85);
    }
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

    for (const blushStop of wardrobeBlushStops) {
      expect(
        contrastRatio(wardrobePalette.textPrimary, blushStop),
      ).toBeGreaterThanOrEqual(7);
      expect(
        contrastRatio(wardrobePalette.textSecondary, blushStop),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(wardrobePalette.primaryMain, blushStop),
      ).toBeGreaterThanOrEqual(4.5);
    }
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

  it("wires blush gradients onto the theme, page chrome, and header", () => {
    expect(appTheme.gradients).toEqual(wardrobeGradients);

    const cssBaseline = appTheme.components?.MuiCssBaseline?.styleOverrides;
    expect(cssBaseline).toMatchObject({
      html: {
        backgroundImage: wardrobeGradients.page,
      },
      body: {
        backgroundImage: wardrobeGradients.page,
      },
    });

    const appBar = appTheme.components?.MuiAppBar?.styleOverrides;
    expect(appBar).toMatchObject({
      root: {
        backgroundImage: wardrobeGradients.header,
      },
    });
  });
});
