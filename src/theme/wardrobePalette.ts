/**
 * Digital Wardrobe color tokens: original burgundy–plum landing theme.
 * Browser chrome (`themeColor`) matches the primary burgundy.
 */
export const wardrobePalette = {
  primaryMain: "#6B1D3A",
  primaryDark: "#4A1228",
  primaryLight: "#8E3A58",
  primaryContrast: "#FBF6F8",
  secondaryMain: "#7A4A6B",
  secondaryDark: "#563344",
  secondaryLight: "#A67C96",
  secondaryContrast: "#FBF6F8",
  backgroundDefault: "#F8F3F5",
  backgroundPaper: "#FFFCFD",
  textPrimary: "#2A121C",
  textSecondary: "#6A4A58",
  divider: "#E6D6DC",
  deviceFrame: "#1A0A12",
  themeColor: "#6B1D3A",
} as const;

export type WardrobePalette = typeof wardrobePalette;

export const wardrobeSurfaceStops = [
  wardrobePalette.backgroundDefault,
  wardrobePalette.backgroundPaper,
] as const;
