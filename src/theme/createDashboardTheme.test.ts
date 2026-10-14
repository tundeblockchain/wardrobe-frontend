import { toggleButtonClasses } from "@mui/material/ToggleButton";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./colorContrast";
import { createDashboardTheme } from "./createDashboardTheme";
import { appTheme } from "./appTheme";
import { wardrobeDarkPalette } from "./wardrobeDarkPalette";

const AA_BODY_AND_UI_TEXT = 4.5;

describe("createDashboardTheme", () => {
  it("returns the existing light appTheme unchanged", () => {
    expect(createDashboardTheme("light")).toBe(appTheme);
  });

  it("meets WCAG AA contrast for key dark-palette pairs", () => {
    const {
      textPrimary,
      textSecondary,
      backgroundDefault,
      backgroundPaper,
      appBarText,
      appBarBackground,
      toggleSelectedText,
      toggleSelectedBackground,
    } = wardrobeDarkPalette;

    expect(contrastRatio(textPrimary, backgroundDefault)).toBeGreaterThanOrEqual(
      AA_BODY_AND_UI_TEXT,
    );
    expect(contrastRatio(textPrimary, backgroundPaper)).toBeGreaterThanOrEqual(
      AA_BODY_AND_UI_TEXT,
    );
    expect(contrastRatio(textSecondary, backgroundDefault)).toBeGreaterThanOrEqual(
      AA_BODY_AND_UI_TEXT,
    );
    expect(contrastRatio(textSecondary, backgroundPaper)).toBeGreaterThanOrEqual(
      AA_BODY_AND_UI_TEXT,
    );
    expect(contrastRatio(appBarText, appBarBackground)).toBeGreaterThanOrEqual(
      AA_BODY_AND_UI_TEXT,
    );
    expect(
      contrastRatio(wardrobeDarkPalette.primaryMain, appBarBackground),
    ).toBeGreaterThanOrEqual(AA_BODY_AND_UI_TEXT);
    expect(
      contrastRatio(toggleSelectedText, toggleSelectedBackground),
    ).toBeGreaterThanOrEqual(AA_BODY_AND_UI_TEXT);
  });

  it("wires the dark tokens into palette and selected-state overrides", () => {
    const theme = createDashboardTheme("dark");

    expect(theme.palette.mode).toBe("dark");
    expect(theme.palette.background.default).toBe(
      wardrobeDarkPalette.backgroundDefault,
    );
    expect(theme.palette.background.paper).toBe(
      wardrobeDarkPalette.backgroundPaper,
    );
    expect(theme.palette.text.primary).toBe(wardrobeDarkPalette.textPrimary);
    expect(theme.palette.text.secondary).toBe(wardrobeDarkPalette.textSecondary);
    expect(theme.palette.primary.main).toBe(wardrobeDarkPalette.primaryMain);
    expect(theme.palette.secondary.dark).toBe(wardrobeDarkPalette.secondaryDark);

    expect(theme.components?.MuiAppBar?.styleOverrides).toMatchObject({
      root: {
        backgroundColor: wardrobeDarkPalette.appBarBackground,
        color: wardrobeDarkPalette.appBarText,
      },
    });

    const toggleRoot = theme.components?.MuiToggleButton?.styleOverrides?.root;
    expect(toggleRoot).toMatchObject({
      [`&.${toggleButtonClasses.selected}`]: {
        color: wardrobeDarkPalette.toggleSelectedText,
        backgroundColor: wardrobeDarkPalette.toggleSelectedBackground,
      },
    });
  });
});
