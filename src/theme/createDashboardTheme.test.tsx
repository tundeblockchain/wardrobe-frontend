import { Avatar, Button, Fab, Switch, ThemeProvider } from "@mui/material";
import { toggleButtonClasses } from "@mui/material/ToggleButton";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./colorContrast";
import { createDashboardTheme } from "./createDashboardTheme";
import { appTheme } from "./appTheme";
import { wardrobeDarkPalette } from "./wardrobeDarkPalette";

const AA_BODY_AND_UI_TEXT = 4.5;
const AA_UI_COMPONENT = 3;

describe("createDashboardTheme", () => {
  it("returns the existing light appTheme unchanged", () => {
    expect(createDashboardTheme("light")).toBe(appTheme);
  });

  it("keeps Sora headings and Inter body text in dark mode", () => {
    const darkTheme = createDashboardTheme("dark");

    expect(darkTheme.typography.fontFamily).toBe(appTheme.typography.fontFamily);
    expect(darkTheme.typography.h1.fontFamily).toBe(
      appTheme.typography.h1.fontFamily,
    );
    expect(darkTheme.typography.h1.fontFamily).toContain("Sora");
    expect(darkTheme.typography.body1.fontFamily).toContain("Inter");
    expect(darkTheme.typography.button.fontFamily).toContain("Inter");
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
      primaryMain,
      primaryContrast,
      uiBorder,
      actionSelected,
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
    expect(contrastRatio(primaryMain, appBarBackground)).toBeGreaterThanOrEqual(
      AA_BODY_AND_UI_TEXT,
    );
    expect(
      contrastRatio(toggleSelectedText, toggleSelectedBackground),
    ).toBeGreaterThanOrEqual(AA_BODY_AND_UI_TEXT);
    expect(contrastRatio(primaryContrast, primaryMain)).toBeGreaterThanOrEqual(
      AA_BODY_AND_UI_TEXT,
    );
    expect(contrastRatio(uiBorder, backgroundPaper)).toBeGreaterThanOrEqual(
      AA_UI_COMPONENT,
    );
    expect(contrastRatio(primaryMain, backgroundPaper)).toBeGreaterThanOrEqual(
      AA_UI_COMPONENT,
    );
    expect(contrastRatio(primaryMain, actionSelected)).toBeGreaterThanOrEqual(
      AA_UI_COMPONENT,
    );
    expect(contrastRatio(textPrimary, actionSelected)).toBeGreaterThanOrEqual(
      AA_BODY_AND_UI_TEXT,
    );
    expect(contrastRatio(textSecondary, actionSelected)).toBeGreaterThanOrEqual(
      AA_BODY_AND_UI_TEXT,
    );
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
    expect(theme.palette.primary.contrastText).toBe(
      wardrobeDarkPalette.primaryContrast,
    );
    expect(theme.palette.secondary.dark).toBe(wardrobeDarkPalette.secondaryDark);
    expect(theme.palette.divider).toBe(wardrobeDarkPalette.divider);
    expect(theme.palette.action.selected).toBe(
      wardrobeDarkPalette.actionSelected,
    );

    expect(theme.components?.MuiAppBar?.styleOverrides).toMatchObject({
      root: {
        backgroundColor: wardrobeDarkPalette.appBarBackground,
        color: wardrobeDarkPalette.appBarText,
      },
    });

    const toggleRoot = theme.components?.MuiToggleButton?.styleOverrides?.root;
    expect(toggleRoot).toMatchObject({
      borderColor: wardrobeDarkPalette.uiBorder,
      [`&.${toggleButtonClasses.selected}`]: {
        color: wardrobeDarkPalette.toggleSelectedText,
        backgroundColor: wardrobeDarkPalette.toggleSelectedBackground,
      },
    });
  });

  it("keeps Fab, Avatar, Switch, and contained buttons on the AA primary pair", () => {
    const theme = createDashboardTheme("dark");
    render(
      <ThemeProvider theme={theme}>
        <Button variant="contained" color="primary">
          Save wardrobe
        </Button>
        <Fab color="primary" aria-label="Add wardrobe">
          +
        </Fab>
        <Avatar
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          S
        </Avatar>
        <Avatar
          sx={{
            bgcolor: "secondary.main",
            color: "secondary.contrastText",
          }}
        >
          A
        </Avatar>
        <Switch
          color="primary"
          defaultChecked
          slotProps={{ input: { "aria-label": "Enable alerts" } }}
        />
      </ThemeProvider>,
    );

    const contained = screen.getByRole("button", { name: "Save wardrobe" });
    const fab = screen.getByRole("button", { name: "Add wardrobe" });
    const primaryAvatar = screen.getByText("S");
    const secondaryAvatar = screen.getByText("A");
    const toggle = screen.getByRole("switch", { name: "Enable alerts" });

    expect(contained).toHaveStyle({
      backgroundColor: "rgb(232, 168, 186)",
      color: "rgb(42, 18, 28)",
    });
    expect(fab).toHaveStyle({
      backgroundColor: "rgb(232, 168, 186)",
      color: "rgb(42, 18, 28)",
    });
    expect(primaryAvatar).toHaveStyle({
      backgroundColor: "rgb(232, 168, 186)",
      color: "rgb(42, 18, 28)",
    });
    expect(secondaryAvatar).toHaveStyle({
      backgroundColor: "rgb(215, 169, 192)",
      color: "rgb(42, 18, 28)",
    });
    expect(toggle).toBeChecked();
    expect(
      contrastRatio(
        theme.palette.primary.contrastText,
        theme.palette.primary.main,
      ),
    ).toBeGreaterThanOrEqual(AA_BODY_AND_UI_TEXT);
    expect(
      contrastRatio(
        theme.palette.secondary.contrastText,
        theme.palette.secondary.main,
      ),
    ).toBeGreaterThanOrEqual(AA_BODY_AND_UI_TEXT);
  });
});
