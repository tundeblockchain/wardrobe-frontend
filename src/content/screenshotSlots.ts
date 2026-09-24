export const SCREENSHOT_WIDTHS = [390, 780, 1170] as const;
export type ScreenshotWidth = (typeof SCREENSHOT_WIDTHS)[number];

export const screenshotFormats = ["avif", "webp", "jpg"] as const;
export type ScreenshotImageFormat = (typeof screenshotFormats)[number];

export const SCREENSHOT_INTRINSIC_WIDTH = 390;
export const SCREENSHOT_INTRINSIC_HEIGHT = 844;

export const heroScreenshotSizes = "(max-width: 899px) 70vw, 300px";
export const showcaseScreenshotSizes = "(max-width: 899px) 72vw, 280px";
export const thumbScreenshotSizes = "88px";
export const galleryScreenshotSizes = "(max-width: 899px) 28vw, 160px";

export type ScreenshotSlotId =
  | "try-on-rust-floral"
  | "try-on-ivory-maxi"
  | "try-on-blue-mini"
  | "home"
  | "item-detail"
  | "add-item";

export type ScreenshotSources = {
  avif: string;
  webp: string;
  jpg: string;
  width: number;
  height: number;
};

export type ScreenshotSlot = {
  id: ScreenshotSlotId;
  label: string;
  description: string;
  src: string;
  sources: ScreenshotSources;
  alt: string;
};

export const screenshotSlotIds: ScreenshotSlotId[] = [
  "try-on-rust-floral",
  "try-on-ivory-maxi",
  "try-on-blue-mini",
  "home",
  "item-detail",
  "add-item",
];

export const getScreenshotSrc = (
  id: ScreenshotSlotId,
  width: ScreenshotWidth = 780,
  format: ScreenshotImageFormat = "jpg",
): string => {
  return `/screenshots/${id}-${width}.${format}`;
};

export const getScreenshotSrcSet = (
  id: ScreenshotSlotId,
  format: ScreenshotImageFormat,
): string => {
  return SCREENSHOT_WIDTHS.map(
    (width) => `${getScreenshotSrc(id, width, format)} ${width}w`,
  ).join(", ");
};

export const getScreenshotSources = (id: ScreenshotSlotId): ScreenshotSources => {
  return {
    avif: getScreenshotSrcSet(id, "avif"),
    webp: getScreenshotSrcSet(id, "webp"),
    jpg: getScreenshotSrcSet(id, "jpg"),
    width: SCREENSHOT_INTRINSIC_WIDTH,
    height: SCREENSHOT_INTRINSIC_HEIGHT,
  };
};

const createScreenshotSlot = (
  id: ScreenshotSlotId,
  label: string,
  description: string,
  alt: string,
): ScreenshotSlot => {
  return {
    id,
    label,
    description,
    alt,
    src: getScreenshotSrc(id),
    sources: getScreenshotSources(id),
  };
};

export const screenshotSlots: ScreenshotSlot[] = [
  createScreenshotSlot(
    "try-on-rust-floral",
    "Virtual Try On",
    "Preview a rust floral maxi on your photo with Virtual Try On.",
    "Pocket Closet Virtual Try On showing a rust floral maxi dress on the user's profile photo",
  ),
  createScreenshotSlot(
    "try-on-ivory-maxi",
    "Ivory maxi",
    "A second Virtual Try On look: an ivory sculpted maxi, viewed from behind.",
    "Pocket Closet Virtual Try On showing an ivory maxi dress on the user's profile photo, viewed from behind",
  ),
  createScreenshotSlot(
    "try-on-blue-mini",
    "Blue mini",
    "Virtual Try On for a powder blue chiffon mini dress on your photo.",
    "Pocket Closet Virtual Try On showing a powder blue mini dress on the user's profile photo",
  ),
  createScreenshotSlot(
    "home",
    "Home",
    "Your closet at a glance — recent pieces and the wardrobes you keep.",
    "Pocket Closet home screen titled My Pocket Closet with recent dresses and the My wardrobe collection",
  ),
  createScreenshotSlot(
    "item-detail",
    "Item detail",
    "Open a garment for category, colour, and which wardrobe it lives in.",
    "Pocket Closet item detail for a plum draped cape maxi dress with category, colour, and wardrobe fields",
  ),
  createScreenshotSlot(
    "add-item",
    "Add item",
    "Photograph a piece or pick one from your gallery, then add its details.",
    "Pocket Closet add item screen with a powder blue chiffon mini dress photo and clothing details form",
  ),
];

export const heroScreenshot = screenshotSlots[0];
