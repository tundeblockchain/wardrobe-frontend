/**
 * Named surface slots kept for SectionSurface / page chrome.
 * Pink blush washes from WARDROBE-110 are removed so landing
 * sections paint with the original flat burgundy–plum tokens.
 */
export const wardrobeGradients = {
  page: "none",
  hero: "none",
  blush: "none",
  mist: "none",
  header: "none",
} as const;

export type WardrobeGradients = typeof wardrobeGradients;

export type WardrobeGradientName = keyof WardrobeGradients;

export type SectionSurfaceVariant = Extract<
  WardrobeGradientName,
  "hero" | "blush" | "mist"
>;
