export const screenshotFormat: "svg" | "png" = "svg";

export type ScreenshotSlotId =
  | "home"
  | "wardrobe-detail"
  | "item-detail"
  | "outfits"
  | "try-on"
  | "account";

export type ScreenshotSlot = {
  id: ScreenshotSlotId;
  label: string;
  description: string;
  src: string;
  alt: string;
};

export const screenshotSlotIds: ScreenshotSlotId[] = [
  "home",
  "wardrobe-detail",
  "item-detail",
  "outfits",
  "try-on",
  "account",
];

export const getScreenshotSrc = (id: ScreenshotSlotId): string => {
  return `/screenshots/${id}.${screenshotFormat}`;
};

export const screenshotSlots: ScreenshotSlot[] = [
  {
    id: "home",
    label: "Home",
    description: "Your closet at a glance, ready to browse.",
    src: getScreenshotSrc("home"),
    alt: "Placeholder for the Home screen",
  },
  {
    id: "wardrobe-detail",
    label: "Wardrobe detail",
    description: "Open a wardrobe and scan every piece.",
    src: getScreenshotSrc("wardrobe-detail"),
    alt: "Placeholder for the Wardrobe detail screen",
  },
  {
    id: "item-detail",
    label: "Item detail",
    description: "A dedicated view for each garment.",
    src: getScreenshotSrc("item-detail"),
    alt: "Placeholder for the Item detail screen",
  },
  {
    id: "outfits",
    label: "Outfits",
    description: "Mix pieces into looks you can revisit.",
    src: getScreenshotSrc("outfits"),
    alt: "Placeholder for the Outfits screen",
  },
  {
    id: "try-on",
    label: "Try-on",
    description: "Preview a look before you get dressed.",
    src: getScreenshotSrc("try-on"),
    alt: "Placeholder for the Try-on screen",
  },
  {
    id: "account",
    label: "Account",
    description: "Preferences and profile in one place.",
    src: getScreenshotSrc("account"),
    alt: "Placeholder for the Account screen",
  },
];
