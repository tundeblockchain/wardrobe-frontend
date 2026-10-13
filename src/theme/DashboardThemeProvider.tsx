import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ThemeProvider, useMediaQuery } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { appTheme } from "./appTheme";
import { ThemePreferenceContext } from "./themePreferenceContext";
import {
  readThemePreference,
  resolveThemeMode,
  writeThemePreference,
  type ResolvedThemeMode,
  type ThemePreference,
} from "./themePreference";

export type { ThemePreferenceContextValue } from "./themePreferenceContext";

const createDashboardTheme = (mode: ResolvedThemeMode) => {
  if (mode === "light") {
    return appTheme;
  }

  return createTheme({
    palette: {
      mode: "dark",
      primary: appTheme.palette.primary,
      secondary: appTheme.palette.secondary,
    },
    gradients: appTheme.gradients,
    typography: appTheme.typography,
    shape: appTheme.shape,
    components: {
      MuiButton: appTheme.components?.MuiButton,
      MuiAppBar: appTheme.components?.MuiAppBar,
    },
  });
};

export type DashboardThemeProviderProps = {
  children: ReactNode;
};

export const DashboardThemeProvider = ({
  children,
}: DashboardThemeProviderProps) => {
  const [preference, setPreference] = useState(readThemePreference);
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const resolvedMode = resolveThemeMode(preference, prefersDark);
  const theme = useMemo(() => createDashboardTheme(resolvedMode), [resolvedMode]);

  const handlePreferenceChange = useCallback((nextPreference: ThemePreference) => {
    writeThemePreference(nextPreference);
    setPreference(nextPreference);
  }, []);

  const value = useMemo(
    () => ({
      preference,
      resolvedMode,
      handlePreferenceChange,
    }),
    [handlePreferenceChange, preference, resolvedMode],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemePreferenceContext.Provider>
  );
};
