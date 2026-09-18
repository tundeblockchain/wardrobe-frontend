import { describe, expect, it } from "vitest";
import { appTheme, wardrobePalette, wardrobeSurfaceStops } from "./appTheme";
import { wardrobeGradients } from "./wardrobeGradients";
import {
  contrastRatio,
  isBurgundyPlumHue,
  isSoftBlush,
} from "./colorContrast";

describe("wardrobePalette", () => {
  it("restores the pre-109 burgundy–plum tokens", () => {
    expect(wardrobePalette).toMatchObject({
      primaryMain: "#6B1D3A",
      primaryDark: "#4A1228",
      primaryLight: "#8E3A58",
      primaryContrast: "#FBF6F8",
      secondaryMain: "#7A4A6B",
      secondaryDark: "#563344",
      secondaryLight: "#A67C96",
      secondaryContrast: "#FBF6F8",
      backgroundDefault: "#F8F3F5",
      backgroundPaper: "#FFFCFD",
      textPrimary: "#2A121C",
      textSecondary: "#6A4A58",
      divider: "#E6D6DC",
      deviceFrame: "#1A0A12",
      themeColor: "#6B1D3A",
    });
    expect(isBurgundyPlumHue(wardrobePalette.primaryMain)).toBe(true);
    expect(isBurgundyPlumHue(wardrobePalette.secondaryMain)).toBe(true);
    expect(wardrobePalette.themeColor).toBe(wardrobePalette.primaryMain);
    expect(wardrobeSurfaceStops).toEqual([
      wardrobePalette.backgroundDefault,
      wardrobePalette.backgroundPaper,
    ]);
  });

  it("does not use the 109/110 flat-white or pink blush surfaces", () => {
    expect(wardrobePalette.backgroundPaper).not.toBe("#FFFFFF");
    expect(wardrobePalette.backgroundDefault).not.toBe("#FBF8F9");
    expect(wardrobePalette.backgroundDefault).not.toBe("#FEF7FA");
    expect(wardrobePalette.backgroundPaper).not.toBe("#FFF8FB");
    expect(wardrobePalette.primaryMain).not.toBe("#8A3554");
    expect(isSoftBlush(wardrobePalette.backgroundPaper)).toBe(false);
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
  it("exposes the original light palette tokens on the MUI theme", () => {
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

  it("keeps named surface slots without blush page or header washes", () => {
    expect(appTheme.gradients).toEqual(wardrobeGradients);

    const cssBaseline = appTheme.components?.MuiCssBaseline?.styleOverrides;
    expect(cssBaseline).toMatchObject({
      html: {
        backgroundColor: wardrobePalette.backgroundDefault,
        backgroundImage: "none",
      },
      body: {
        backgroundColor: wardrobePalette.backgroundDefault,
        backgroundImage: "none",
      },
    });

    const appBar = appTheme.components?.MuiAppBar?.styleOverrides;
    expect(appBar).toMatchObject({
      root: {
        backgroundColor: wardrobePalette.primaryMain,
        backgroundImage: "none",
        color: wardrobePalette.primaryContrast,
      },
    });
  });
});
