import { createContext } from "react";
import type { ResolvedThemeMode, ThemePreference } from "./themePreference";

export type ThemePreferenceContextValue = {
  preference: ThemePreference;
  resolvedMode: ResolvedThemeMode;
  handlePreferenceChange: (preference: ThemePreference) => void;
};

export const ThemePreferenceContext = createContext<
  ThemePreferenceContextValue | undefined
>(undefined);
