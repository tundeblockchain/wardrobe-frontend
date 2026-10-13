import type { ReactElement } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../auth/AuthProvider";
import type { AuthState } from "../auth/authContext";
import { appTheme } from "../theme/appTheme";

type RenderWithProvidersOptions = {
  route?: string;
  routeState?: unknown;
  auth?: Partial<AuthState>;
  liveAuth?: boolean;
};

export const renderWithProviders = (
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
) => {
  const { route = "/", routeState, auth, liveAuth = false } = options;
  const authState: AuthState = {
    user: auth?.user ?? null,
    loading: auth?.loading ?? false,
  };
  const routeUrl = new URL(route, "http://localhost");

  return render(
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AuthProvider initialState={liveAuth ? undefined : authState}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: routeUrl.pathname,
              search: routeUrl.search,
              hash: routeUrl.hash,
              state: routeState,
            },
          ]}
        >
          {ui}
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>,
  );
};
