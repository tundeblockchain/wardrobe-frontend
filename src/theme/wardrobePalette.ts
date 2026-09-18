/**
 * Digital Wardrobe color tokens: airy light surfaces with soft pink blush
 * stops for gradients. Browser chrome (`themeColor`) matches the page canvas.
 */
export const wardrobePalette = {
  primaryMain: "#8A3554",
  primaryDark: "#5C1C36",
  primaryLight: "#C47A94",
  primaryContrast: "#FFF9FB",
  secondaryMain: "#8D5C76",
  secondaryDark: "#6A3F58",
  secondaryLight: "#D2B3C3",
  secondaryContrast: "#FFF9FB",
  blushPetal: "#FFF8FB",
  blushCanvas: "#FEF7FA",
  blushWash: "#FCEFF4",
  blushMist: "#FBEAF1",
  backgroundDefault: "#FEF7FA",
  backgroundPaper: "#FFF8FB",
  textPrimary: "#2C1820",
  textSecondary: "#6B5460",
  divider: "#EDE3E8",
  deviceFrame: "#3A2430",
  themeColor: "#FEF7FA",
} as const;

export type WardrobePalette = typeof wardrobePalette;

export const wardrobeBlushStops = [
  wardrobePalette.blushPetal,
  wardrobePalette.blushCanvas,
  wardrobePalette.blushWash,
  wardrobePalette.blushMist,
] as const;
