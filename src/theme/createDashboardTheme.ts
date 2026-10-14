import { switchClasses } from "@mui/material/Switch";
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
          outlined: {
            borderColor: wardrobeDarkPalette.uiBorder,
          },
        },
        variants: [
          {
            props: { variant: "contained", color: "primary" },
            style: {
              backgroundColor: wardrobeDarkPalette.primaryMain,
              color: wardrobeDarkPalette.primaryContrast,
              "&:hover": {
                backgroundColor: wardrobeDarkPalette.primaryHover,
              },
            },
          },
        ],
      },
      MuiFab: {
        variants: [
          {
            props: { color: "primary" },
            style: {
              backgroundColor: wardrobeDarkPalette.primaryMain,
              color: wardrobeDarkPalette.primaryContrast,
              "&:hover": {
                backgroundColor: wardrobeDarkPalette.primaryHover,
              },
            },
          },
        ],
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            [`&.${switchClasses.checked}`]: {
              color: wardrobeDarkPalette.primaryMain,
            },
          },
          colorPrimary: {
            [`&.${switchClasses.checked}`]: {
              color: wardrobeDarkPalette.primaryMain,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          outlined: {
            borderColor: wardrobeDarkPalette.uiBorder,
          },
        },
        variants: [
          {
            props: { variant: "filled", color: "primary" },
            style: {
              backgroundColor: wardrobeDarkPalette.primaryMain,
              color: wardrobeDarkPalette.primaryContrast,
            },
          },
        ],
      },
      MuiBadge: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: wardrobeDarkPalette.primaryMain,
            color: wardrobeDarkPalette.primaryContrast,
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            color: wardrobeDarkPalette.textSecondary,
            borderColor: wardrobeDarkPalette.uiBorder,
            [`&.${toggleButtonClasses.selected}`]: {
              color: wardrobeDarkPalette.toggleSelectedText,
              backgroundColor: wardrobeDarkPalette.toggleSelectedBackground,
              "&:hover": {
                backgroundColor: wardrobeDarkPalette.primaryHover,
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
