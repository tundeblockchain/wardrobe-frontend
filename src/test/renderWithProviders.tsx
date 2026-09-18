import type { ReactElement } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { appTheme } from "../theme/appTheme";

export const renderWithProviders = (ui: ReactElement) => {
  return render(
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>,
  );
};
