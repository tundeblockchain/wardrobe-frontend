export const THEME_PREFERENCE_STORAGE_KEY = "wardrobe.theme-preference";

export const THEME_PREFERENCES = ["system", "light", "dark"] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export type ResolvedThemeMode = "light" | "dark";

export const isThemePreference = (value: unknown): value is ThemePreference => {
  return (
    value === "system" || value === "light" || value === "dark"
  );
};

export const readThemePreference = (): ThemePreference => {
  if (typeof window === "undefined") {
    return "system";
  }

  const stored = window.localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);
  if (isThemePreference(stored)) {
    return stored;
  }

  return "system";
};

export const writeThemePreference = (preference: ThemePreference): void => {
  window.localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, preference);
};

export const resolveThemeMode = (
  preference: ThemePreference,
  prefersDark: boolean,
): ResolvedThemeMode => {
  if (preference === "system") {
    return prefersDark ? "dark" : "light";
  }

  return preference;
};
