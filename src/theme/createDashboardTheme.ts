import { toggleButtonClasses } from "@mui/material/ToggleButton";
import { alpha, createTheme } from "@mui/material/styles";
import { appTheme } from "./appTheme";
import type { ResolvedThemeMode } from "./themePreference";
import { wardrobeDarkPalette } from "./wardrobeDarkPalette";

export const createDashboardTheme = (mode: ResolvedThemeMode) => {
  if (mode === "light") {
    return appTheme;
  }

  return createTheme({
    palette: {
      mode: "dark",
      primary: {
        main: wardrobeDarkPalette.primaryMain,
        dark: wardrobeDarkPalette.primaryDark,
        light: wardrobeDarkPalette.primaryLight,
        contrastText: wardrobeDarkPalette.primaryContrast,
      },
      secondary: {
        main: wardrobeDarkPalette.secondaryMain,
        dark: wardrobeDarkPalette.secondaryDark,
        light: wardrobeDarkPalette.secondaryLight,
        contrastText: wardrobeDarkPalette.secondaryContrast,
      },
      background: {
        default: wardrobeDarkPalette.backgroundDefault,
        paper: wardrobeDarkPalette.backgroundPaper,
      },
      text: {
        primary: wardrobeDarkPalette.textPrimary,
        secondary: wardrobeDarkPalette.textSecondary,
      },
      divider: wardrobeDarkPalette.divider,
    },
    gradients: appTheme.gradients,
    typography: appTheme.typography,
    shape: appTheme.shape,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            backgroundColor: wardrobeDarkPalette.backgroundDefault,
            backgroundImage: "none",
            colorScheme: "dark",
          },
          body: {
            backgroundColor: wardrobeDarkPalette.backgroundDefault,
            backgroundImage: "none",
            color: wardrobeDarkPalette.textPrimary,
            minHeight: "100%",
          },
          "::selection": {
            backgroundColor: alpha(wardrobeDarkPalette.primaryMain, 0.28),
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
          },
          containedPrimary: {
            backgroundColor: wardrobeDarkPalette.containedPrimaryBackground,
            color: wardrobeDarkPalette.containedPrimaryText,
            "&:hover": {
              backgroundColor: wardrobeDarkPalette.containedPrimaryHover,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          filledPrimary: {
            backgroundColor: wardrobeDarkPalette.containedPrimaryBackground,
            color: wardrobeDarkPalette.containedPrimaryText,
          },
        },
      },
      MuiBadge: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: wardrobeDarkPalette.containedPrimaryBackground,
            color: wardrobeDarkPalette.containedPrimaryText,
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            color: wardrobeDarkPalette.textSecondary,
            borderColor: wardrobeDarkPalette.divider,
            [`&.${toggleButtonClasses.selected}`]: {
              color: wardrobeDarkPalette.toggleSelectedText,
              backgroundColor: wardrobeDarkPalette.toggleSelectedBackground,
              "&:hover": {
                backgroundColor: wardrobeDarkPalette.containedPrimaryHover,
              },
            },
          },
        },
      },
      MuiAppBar: {
        defaultProps: {
          color: "inherit",
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundColor: wardrobeDarkPalette.appBarBackground,
            backgroundImage: "none",
            color: wardrobeDarkPalette.appBarText,
            borderBottom: `1px solid ${wardrobeDarkPalette.appBarBorder}`,
            boxShadow: "none",
          },
          colorPrimary: {
            backgroundColor: wardrobeDarkPalette.appBarBackground,
            color: wardrobeDarkPalette.appBarText,
          },
          colorInherit: {
            backgroundColor: wardrobeDarkPalette.appBarBackground,
            color: wardrobeDarkPalette.appBarText,
          },
        },
      },
    },
  });
};
