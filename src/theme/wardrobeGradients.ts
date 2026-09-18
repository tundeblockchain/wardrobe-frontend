import { wardrobePalette } from "./wardrobePalette";

const {
  blushPetal,
  blushCanvas,
  blushWash,
  blushMist,
} = wardrobePalette;

/**
 * Soft pink blush washes for page chrome and section surfaces.
 * Stops stay airy (high luminance, low chroma) — not neon, not dark.
 */
export const wardrobeGradients = {
  page: [
    `radial-gradient(1200px 640px at 8% -12%, ${blushPetal} 0%, transparent 58%)`,
    `radial-gradient(900px 520px at 100% 0%, ${blushWash} 0%, transparent 55%)`,
    `linear-gradient(180deg, ${blushCanvas} 0%, ${blushMist} 46%, ${blushCanvas} 100%)`,
  ].join(", "),
  hero: [
    `radial-gradient(ellipse 80% 70% at 92% 8%, ${blushWash} 0%, transparent 58%)`,
    `radial-gradient(ellipse 55% 50% at 0% 100%, ${blushMist} 0%, transparent 52%)`,
    `linear-gradient(165deg, ${blushPetal} 0%, ${blushCanvas} 42%, ${blushWash} 100%)`,
  ].join(", "),
  blush: [
    `radial-gradient(900px 480px at 100% 0%, ${blushPetal} 0%, transparent 60%)`,
    `linear-gradient(180deg, ${blushPetal} 0%, ${blushWash} 100%)`,
  ].join(", "),
  mist: [
    `radial-gradient(800px 420px at 0% 0%, ${blushWash} 0%, transparent 55%)`,
    `linear-gradient(180deg, ${blushCanvas} 0%, ${blushMist} 100%)`,
  ].join(", "),
  header: `linear-gradient(180deg, ${blushPetal} 0%, ${blushCanvas} 100%)`,
} as const;

export type WardrobeGradients = typeof wardrobeGradients;

export type WardrobeGradientName = keyof WardrobeGradients;

export type SectionSurfaceVariant = Extract<
  WardrobeGradientName,
  "hero" | "blush" | "mist"
>;
