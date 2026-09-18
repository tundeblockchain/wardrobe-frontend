import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#6B1D3A",
      dark: "#4A1228",
      light: "#8E3A58",
      contrastText: "#FBF6F8",
    },
    secondary: {
      main: "#7A4A6B",
      dark: "#563344",
      light: "#A67C96",
      contrastText: "#FBF6F8",
    },
    background: {
      default: "#F8F3F5",
      paper: "#FFFCFD",
    },
    text: {
      primary: "#2A121C",
      secondary: "#6A4A58",
    },
    divider: "#E6D6DC",
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
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
  },
});
