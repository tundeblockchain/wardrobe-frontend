import type { ReactElement } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../auth/AuthProvider";
import type { AuthState } from "../auth/authContext";
import { appTheme } from "../theme/appTheme";

type RenderWithProvidersOptions = {
  route?: string;
  auth?: Partial<AuthState>;
};

export const renderWithProviders = (
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
) => {
  const { route = "/", auth } = options;
  const authState: AuthState = {
    user: auth?.user ?? null,
    loading: auth?.loading ?? false,
  };

  return render(
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AuthProvider initialState={authState}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthProvider>
    </ThemeProvider>,
  );
};
