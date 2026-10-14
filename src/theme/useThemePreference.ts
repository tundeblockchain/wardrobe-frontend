import { useContext } from "react";
import { ThemePreferenceContext } from "./themePreferenceContext";
import type { ThemePreferenceContextValue } from "./themePreferenceContext";

export const useThemePreference = (): ThemePreferenceContextValue => {
  const value = useContext(ThemePreferenceContext);
  if (!value) {
    return {
      preference: "light",
      resolvedMode: "light",
      handlePreferenceChange: () => undefined,
    };
  }

  return value;
};
