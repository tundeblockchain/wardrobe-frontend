import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2C1810",
      contrastText: "#FBF8F4",
    },
    secondary: {
      main: "#8B6B4A",
    },
    background: {
      default: "#F7F3EE",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1F1714",
      secondary: "#5C514A",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "1.25rem",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});
