import {
  ALLOWED_UPLOAD_CONTENT_TYPES,
  CLOTHING_CATEGORIES,
  COLOUR_MAX_LENGTH,
  MAX_UPLOAD_BYTES,
  NAME_MAX_LENGTH,
  type ClothingCategory,
  type OutfitItem,
} from "./resourceTypes";

export type WardrobeFormValues = {
  name: string;
};

export type ItemFormValues = {
  name: string;
  category: string;
  subcategory: string;
  colours: string;
  brand: string;
  acquiredAt: string;
};

export type OutfitFormValues = {
  name: string;
  wardrobeId: string;
  items: OutfitItem[];
};

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

const daysInMonth = (year: number, month: number): number => {
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }

  return DAYS_IN_MONTH[month] ?? 0;
};

export const isIsoDate = (value: string): boolean => {
  const match = ISO_DATE_PATTERN.exec(value.trim());
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return (
    year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  );
};

export const isClothingCategory = (value: string): value is ClothingCategory => {
  return (CLOTHING_CATEGORIES as readonly string[]).includes(value);
};

export const resolveUploadContentType = (file: File): string => {
  const typed = file.type.trim().toLowerCase();
  if (typed.length > 0) {
    return typed;
  }

  const fileName = file.name.trim().toLowerCase();
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (fileName.endsWith(".png")) {
    return "image/png";
  }
  if (fileName.endsWith(".webp")) {
    return "image/webp";
  }
  if (fileName.endsWith(".heic")) {
    return "image/heic";
  }

  return typed;
};

export const isAllowedUploadContentType = (contentType: string): boolean => {
  return (ALLOWED_UPLOAD_CONTENT_TYPES as readonly string[]).includes(
    contentType,
  );
};

export const validateRequiredName = (name: string): string | undefined => {
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return "Name is required.";
  }
  if (trimmedName.length > NAME_MAX_LENGTH) {
    return `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  }

  return undefined;
};

export const parseColourList = (value: string): string[] => {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

export const validateWardrobeForm = (
  values: WardrobeFormValues,
): FieldErrors<"name"> => {
  const nameError = validateRequiredName(values.name);
  return nameError ? { name: nameError } : {};
};

export const validateItemForm = (
  values: ItemFormValues,
  options: { requireImage: boolean; hasImage: boolean },
): FieldErrors<
  "name" | "category" | "colours" | "acquiredAt" | "image"
> => {
  const errors: FieldErrors<
    "name" | "category" | "colours" | "acquiredAt" | "image"
  > = {};
  const nameError = validateRequiredName(values.name);
  if (nameError) {
    errors.name = nameError;
  }

  if (!isClothingCategory(values.category.trim())) {
    errors.category = `Category must be one of: ${CLOTHING_CATEGORIES.join(", ")}.`;
  }

  const colours = parseColourList(values.colours);
  const tooLongColour = colours.find(
    (colour) => colour.length > COLOUR_MAX_LENGTH,
  );
  if (tooLongColour) {
    errors.colours = `Each colour must be ${COLOUR_MAX_LENGTH} characters or fewer.`;
  }

  const acquiredAt = values.acquiredAt.trim();
  if (acquiredAt.length > 0 && !isIsoDate(acquiredAt)) {
    errors.acquiredAt = "Acquired date must be a valid calendar date (YYYY-MM-DD).";
  }

  if (options.requireImage && !options.hasImage) {
    errors.image = "A photo is required.";
  }

  return errors;
};

export const validateOutfitForm = (
  values: OutfitFormValues,
): FieldErrors<"name" | "wardrobeId" | "items"> => {
  const errors: FieldErrors<"name" | "wardrobeId" | "items"> = {};
  const nameError = validateRequiredName(values.name);
  if (nameError) {
    errors.name = nameError;
  }

  if (values.wardrobeId.trim().length === 0) {
    errors.wardrobeId = "Wardrobe is required.";
  }

  if (values.items.length === 0) {
    errors.items = "Choose at least one clothing item.";
    return errors;
  }

  const seenItemIds = new Set<string>();
  const seenUniqueSlots = new Set<string>();

  for (const entry of values.items) {
    if (!entry.itemId.trim()) {
      errors.items = "Each selected item needs an item id.";
      return errors;
    }
    if (seenItemIds.has(entry.itemId)) {
      errors.items = "Each clothing item can only be used once.";
      return errors;
    }
    seenItemIds.add(entry.itemId);

    if (!isClothingCategory(entry.slot)) {
      errors.items = `Slot must be one of: ${CLOTHING_CATEGORIES.join(", ")}.`;
      return errors;
    }

    if (entry.slot === "ACCESSORY") {
      continue;
    }

    if (seenUniqueSlots.has(entry.slot)) {
      errors.items = `Slot ${entry.slot} can only appear once (ACCESSORY may appear multiple times).`;
      return errors;
    }
    seenUniqueSlots.add(entry.slot);
  }

  return errors;
};

export const validateImageFile = (file: File): string | undefined => {
  const contentType = resolveUploadContentType(file);
  if (!isAllowedUploadContentType(contentType)) {
    return "Use a JPEG, PNG, WebP, or HEIC photo.";
  }
  if (file.size < 1) {
    return "Choose a photo to upload.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Photo must be 10 MB or smaller.";
  }

  return undefined;
};
