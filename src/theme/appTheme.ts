import { alpha, createTheme } from "@mui/material/styles";
import { wardrobePalette } from "./wardrobePalette";

export { wardrobePalette } from "./wardrobePalette";

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
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      letterSpacing: "-0.03em",
      lineHeight: 1.15,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontSize: "1.25rem",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: wardrobePalette.backgroundDefault,
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
        color: "inherit",
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: wardrobePalette.backgroundPaper,
          backgroundImage: "none",
          color: wardrobePalette.primaryMain,
          borderBottom: `1px solid ${wardrobePalette.divider}`,
        },
      },
    },
  },
});
