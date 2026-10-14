import { useCallback, useMemo, useState, type ReactNode } from "react";
import { CssBaseline, ThemeProvider, useMediaQuery } from "@mui/material";
import { createDashboardTheme } from "./createDashboardTheme";
import { ThemePreferenceContext } from "./themePreferenceContext";
import {
  readThemePreference,
  resolveThemeMode,
  writeThemePreference,
  type ThemePreference,
} from "./themePreference";

export type { ThemePreferenceContextValue } from "./themePreferenceContext";

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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemePreferenceContext.Provider>
  );
};
