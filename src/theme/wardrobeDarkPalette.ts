/**
 * Dashboard-only dark tokens. Light `wardrobePalette` stays unchanged.
 * Primary and accent use lighter burgundy–plum tints so text and
 * selected controls stay readable on near-black surfaces.
 */
export const wardrobeDarkPalette = {
  backgroundDefault: "#140E11",
  backgroundPaper: "#1C1518",
  textPrimary: "#F6EDF0",
  textSecondary: "#CDB8C0",
  divider: "#3A2A30",
  primaryMain: "#E8A8BA",
  primaryDark: "#2B1A20",
  primaryLight: "#F3C5D0",
  primaryContrast: "#F6EDF0",
  secondaryMain: "#D7A9C0",
  secondaryDark: "#E6B7C8",
  secondaryLight: "#E8C8D6",
  secondaryContrast: "#2A121C",
  appBarBackground: "#1A1216",
  appBarText: "#F6EDF0",
  appBarBorder: "#3A2A30",
  toggleSelectedBackground: "#5C3342",
  toggleSelectedText: "#F6EDF0",
  containedPrimaryBackground: "#9A4E66",
  containedPrimaryText: "#F6EDF0",
  containedPrimaryHover: "#8B3A54",
} as const;

export type WardrobeDarkPalette = typeof wardrobeDarkPalette;
