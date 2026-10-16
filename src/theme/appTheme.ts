import { alpha, createTheme } from "@mui/material/styles";
import { appTypography } from "./typography";
import { wardrobeGradients } from "./wardrobeGradients";
import { wardrobePalette } from "./wardrobePalette";

export { wardrobeGradients } from "./wardrobeGradients";
export { wardrobePalette, wardrobeSurfaceStops } from "./wardrobePalette";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: wardrobePalette.primaryMain,
      dark: wardrobePalette.primaryDark,
      light: wardrobePalette.primaryLight,
      contrastText: wardrobePalette.primaryContrast,
    },
    secondary: {
      main: wardrobePalette.secondaryMain,
      dark: wardrobePalette.secondaryDark,
      light: wardrobePalette.secondaryLight,
      contrastText: wardrobePalette.secondaryContrast,
    },
    background: {
      default: wardrobePalette.backgroundDefault,
      paper: wardrobePalette.backgroundPaper,
    },
    text: {
      primary: wardrobePalette.textPrimary,
      secondary: wardrobePalette.textSecondary,
    },
    divider: wardrobePalette.divider,
  },
  gradients: wardrobeGradients,
  typography: appTypography,
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          backgroundColor: wardrobePalette.backgroundDefault,
          backgroundImage: "none",
        },
        body: {
          backgroundColor: wardrobePalette.backgroundDefault,
          backgroundImage: "none",
          minHeight: "100%",
        },
        "::selection": {
          backgroundColor: alpha(wardrobePalette.primaryMain, 0.16),
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        color: "primary",
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: wardrobePalette.primaryMain,
          backgroundImage: "none",
          color: wardrobePalette.primaryContrast,
        },
      },
    },
  },
});
