import { isMockApi } from "../config/mockApi";
import type { AuthenticatedApi } from "./authenticatedApi";
import {
  type FieldErrors,
  isClothingCategory,
  validateRequiredName,
} from "./catalogValidation";
import { ApiError, isApiError } from "./httpClient";
import type {
  ClothingCategory,
  ClothingItem,
  CreateUploadResponse,
} from "./resourceTypes";

export const WISHLIST_API_PATH = "/wishlist";
export const WISHLIST_COLLECTION_PATH = WISHLIST_API_PATH;
export const WISHLIST_UPLOADS_PATH = "/wishlist/uploads";
export const WISHLIST_LIMIT = 500;
export const WISHLIST_MAX_ITEMS = WISHLIST_LIMIT;
export const WISHLIST_LIMIT_CODE = "WISHLIST_LIMIT";
export const WISHLIST_LIMIT_MESSAGE = "Wish list can hold 500 items.";
export const WISH_NOTES_MAX_LENGTH = 1000;
export const WISH_LINK_MAX_LENGTH = 2048;
export const WISHLIST_PAGE_SIZE = 20;
export const WISHLIST_PAGE_SIZE_MAX = 50;
export const UPLOAD_PURPOSE_WISHLIST = "WISHLIST";
export const WISH_NOT_FOUND_CODE = "WISH_NOT_FOUND";
export const WARDROBE_NOT_FOUND_CODE = "WARDROBE_NOT_FOUND";
export const VALIDATION_ERROR_CODE = "VALIDATION_ERROR";
export const UPLOAD_INVALID_CODE = "UPLOAD_INVALID";
export const WISH_CURRENCIES = ["GBP", "USD", "EUR"] as const;

export type WishCurrency = (typeof WISH_CURRENCIES)[number];

export type WishImage = {
  originalKey: string;
};

export type WishPrice = {
  amount: number;
  currency: string;
};

export type WishItem = {
  wishId: string;
  name: string;
  category?: ClothingCategory;
  subcategory?: string;
  image?: WishImage;
  originalImageUrl?: string;
  link?: string;
  price?: WishPrice;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type WishList = {
  wishes: WishItem[];
  nextCursor?: string;
};

export type ListWishesOptions = {
  limit?: number;
  cursor?: string;
  category?: ClothingCategory;
};

export type CreateWishRequest = {
  name: string;
  category?: ClothingCategory;
  subcategory?: string;
  imageKey?: string;
  link?: string;
  price?: WishPrice;
  notes?: string;
};

export type UpdateWishRequest = {
  name?: string;
  category?: ClothingCategory | null;
  subcategory?: string | null;
  imageKey?: string | null;
  link?: string | null;
  price?: WishPrice | null;
  notes?: string | null;
};

export type AcquireWishRequest = {
  wardrobeId: string;
};

export type CreateWishlistUploadRequest = {
  contentType: string;
  contentLength?: number;
  purpose?: typeof UPLOAD_PURPOSE_WISHLIST;
};

export type WishFormValues = {
  name: string;
  category: string;
  subcategory: string;
  link: string;
  price: string;
  currency: string;
  notes: string;
};

export type WishFormField =
  | "name"
  | "category"
  | "subcategory"
  | "link"
  | "price"
  | "currency"
  | "notes"
  | "image";

export type MissingAcquireDetails = {
  category: boolean;
  image: boolean;
};

export type WishlistApi = {
  listWishes: (options?: ListWishesOptions) => Promise<WishList>;
  getWish: (wishId: string) => Promise<WishItem>;
  createWish: (body: CreateWishRequest) => Promise<WishItem>;
  updateWish: (wishId: string, body: UpdateWishRequest) => Promise<WishItem>;
  deleteWish: (wishId: string) => Promise<void>;
  acquireWish: (
    wishId: string,
    body: AcquireWishRequest,
  ) => Promise<ClothingItem>;
  createUpload: (
    body: CreateWishlistUploadRequest,
  ) => Promise<CreateUploadResponse>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const getWishlistApiPath = (options?: ListWishesOptions): string => {
  const params = new URLSearchParams();
  if (options?.limit !== undefined) {
    params.set("limit", String(options.limit));
  }
  if (options?.cursor) {
    params.set("cursor", options.cursor);
  }
  if (options?.category) {
    params.set("category", options.category);
  }

  const query = params.toString();
  return query.length > 0 ? `${WISHLIST_API_PATH}?${query}` : WISHLIST_API_PATH;
};

export const getWishApiPath = (wishId: string): string => {
  return `${WISHLIST_API_PATH}/${encodeURIComponent(wishId)}`;
};

export const getAcquireWishApiPath = (wishId: string): string => {
  return `${getWishApiPath(wishId)}/acquire`;
};

export const getWishAcquireApiPath = getAcquireWishApiPath;

export const getWishImageUrl = (wish: WishItem): string | undefined => {
  const imageUrl = wish.originalImageUrl?.trim();
  return imageUrl && imageUrl.length > 0 ? imageUrl : undefined;
};

export const hasWishImage = (wish: WishItem): boolean => {
  return Boolean(wish.image?.originalKey || getWishImageUrl(wish));
};

export const getMissingAcquireDetails = (
  wish: WishItem,
): MissingAcquireDetails => {
  return {
    category: wish.category === undefined,
    image: !hasWishImage(wish),
  };
};

export const isWishReadyToAcquire = (wish: WishItem): boolean => {
  const missing = getMissingAcquireDetails(wish);
  return !missing.category && !missing.image;
};

export const isHttpsUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const isAllowedWishLink = (value: string): boolean => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return true;
  }

  return isHttpsUrl(trimmed);
};

export const getSafeWishLinkUrl = (value: string | undefined): string | undefined => {
  if (!value || !isAllowedWishLink(value) || value.trim().length === 0) {
    return undefined;
  }

  return value.trim();
};

export const formatWishPrice = (price?: WishPrice): string | undefined => {
  if (!price || !Number.isFinite(price.amount) || !price.currency) {
    return undefined;
  }

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: price.currency,
    }).format(price.amount);
  } catch {
    return `${price.amount} ${price.currency}`;
  }
};

const toWishPrice = (value: unknown): WishPrice | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  if (typeof value.amount !== "number" || !Number.isFinite(value.amount)) {
    return undefined;
  }

  if (typeof value.currency !== "string" || value.currency.trim().length === 0) {
    return undefined;
  }

  return {
    amount: value.amount,
    currency: value.currency.trim(),
  };
};

const toWishImage = (value: unknown): WishImage | undefined => {
  if (!isRecord(value) || typeof value.originalKey !== "string") {
    return undefined;
  }

  const originalKey = value.originalKey.trim();
  if (originalKey.length === 0) {
    return undefined;
  }

  return { originalKey };
};

const optionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const toWishItem = (body: unknown): WishItem => {
  if (!isRecord(body) || typeof body.wishId !== "string") {
    throw new Error("Wish is missing wishId.");
  }
  if (typeof body.name !== "string") {
    throw new Error("Wish is missing name.");
  }
  if (typeof body.createdAt !== "string" || typeof body.updatedAt !== "string") {
    throw new Error("Wish is missing timestamps.");
  }

  const wish: WishItem = {
    wishId: body.wishId,
    name: body.name,
    createdAt: body.createdAt,
    updatedAt: body.updatedAt,
  };

  if (typeof body.category === "string" && isClothingCategory(body.category)) {
    wish.category = body.category;
  }

  const subcategory = optionalString(body.subcategory);
  if (subcategory) {
    wish.subcategory = subcategory;
  }

  const image = toWishImage(body.image);
  if (image) {
    wish.image = image;
  }

  const originalImageUrl = optionalString(body.originalImageUrl);
  if (originalImageUrl) {
    wish.originalImageUrl = originalImageUrl;
  }

  const link = optionalString(body.link);
  if (link) {
    wish.link = link;
  }

  const price = toWishPrice(body.price);
  if (price) {
    wish.price = price;
  }

  const notes = optionalString(body.notes);
  if (notes) {
    wish.notes = notes;
  }

  return wish;
};

export const toWishList = (body: unknown): WishList => {
  if (!isRecord(body) || !Array.isArray(body.wishes)) {
    throw new Error("Wish list response is missing wishes.");
  }

  const list: WishList = {
    wishes: body.wishes.map((wish) => toWishItem(wish)),
  };

  if (typeof body.nextCursor === "string" && body.nextCursor.length > 0) {
    list.nextCursor = body.nextCursor;
  }

  return list;
};

export const toClothingItemFromAcquire = (body: unknown): ClothingItem => {
  if (!isRecord(body) || typeof body.itemId !== "string") {
    throw new Error("Acquire response is missing itemId.");
  }
  if (typeof body.wardrobeId !== "string") {
    throw new Error("Acquire response is missing wardrobeId.");
  }
  if (typeof body.name !== "string") {
    throw new Error("Acquire response is missing name.");
  }
  if (typeof body.category !== "string" || !isClothingCategory(body.category)) {
    throw new Error("Acquire response is missing category.");
  }
  if (typeof body.createdAt !== "string" || typeof body.updatedAt !== "string") {
    throw new Error("Acquire response is missing timestamps.");
  }

  return body as ClothingItem;
};

export const validateWishForm = (
  values: WishFormValues,
): FieldErrors<WishFormField> => {
  const errors: FieldErrors<WishFormField> = {};
  const nameError = validateRequiredName(values.name);
  if (nameError) {
    errors.name = nameError;
  }

  if (values.category.trim() && !isClothingCategory(values.category)) {
    errors.category = "Choose a category from the list.";
  }

  const link = values.link.trim();
  if (!isAllowedWishLink(link)) {
    errors.link = "Enter an https:// link.";
  } else if (link.length > WISH_LINK_MAX_LENGTH) {
    errors.link = `Link must be ${WISH_LINK_MAX_LENGTH} characters or fewer.`;
  }

  const amount = parseWishPrice(values.price);
  if (values.price.trim().length > 0 && amount === undefined) {
    errors.price = "Enter a price of 0 or more.";
  } else if (amount !== undefined && amount < 0) {
    errors.price = "Enter a price of 0 or more.";
  }

  const currency = values.currency.trim().toUpperCase();
  if (currency && !/^[A-Z]{3}$/.test(currency)) {
    errors.currency = "Currency must be a 3-letter code.";
  }

  if (amount !== undefined && !currency) {
    errors.currency = "Choose a currency.";
  }

  if (currency && amount === undefined && !errors.price) {
    errors.price = "Enter a price.";
  }

  const notes = values.notes.trim();
  if (notes.length > WISH_NOTES_MAX_LENGTH) {
    errors.notes = `Notes must be ${WISH_NOTES_MAX_LENGTH} characters or fewer.`;
  }

  return errors;
};

export const valuesFromWish = (wish: WishItem): WishFormValues => {
  return {
    name: wish.name,
    category: wish.category ?? "",
    subcategory: wish.subcategory ?? "",
    link: wish.link ?? "",
    price: wish.price === undefined ? "" : String(wish.price.amount),
    currency: wish.price?.currency ?? "",
    notes: wish.notes ?? "",
  };
};

export const EMPTY_WISH_FORM_VALUES: WishFormValues = {
  name: "",
  category: "",
  subcategory: "",
  link: "",
  price: "",
  currency: "",
  notes: "",
};

const optionalFormString = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const parseWishPrice = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
};

const toWishPriceFromForm = (
  values: WishFormValues,
): WishPrice | undefined => {
  const amount = parseWishPrice(values.price);
  const currency = values.currency.trim().toUpperCase();
  if (amount === undefined || !/^[A-Z]{3}$/.test(currency)) {
    return undefined;
  }

  return { amount, currency };
};

export const toCreateWishRequest = (
  values: WishFormValues,
  imageKey?: string,
): CreateWishRequest => {
  const body: CreateWishRequest = {
    name: values.name.trim(),
  };

  if (isClothingCategory(values.category)) {
    body.category = values.category;
  }

  const subcategory = optionalFormString(values.subcategory);
  if (subcategory) {
    body.subcategory = subcategory;
  }

  if (imageKey) {
    body.imageKey = imageKey;
  }

  const link = optionalFormString(values.link);
  if (link) {
    body.link = link;
  }

  const price = toWishPriceFromForm(values);
  if (price) {
    body.price = price;
  }

  const notes = optionalFormString(values.notes);
  if (notes) {
    body.notes = notes;
  }

  return body;
};

export const toUpdateWishRequest = (
  values: WishFormValues,
  imageKey?: string,
): UpdateWishRequest => {
  const body: UpdateWishRequest = {
    name: values.name.trim(),
    category: isClothingCategory(values.category) ? values.category : null,
    subcategory: optionalFormString(values.subcategory) ?? null,
    link: optionalFormString(values.link) ?? null,
    notes: optionalFormString(values.notes) ?? null,
    price: toWishPriceFromForm(values) ?? null,
  };

  if (imageKey) {
    body.imageKey = imageKey;
  }

  return body;
};

export const wishlistLimitError = (): ApiError => {
  return new ApiError({
    status: 409,
    code: WISHLIST_LIMIT_CODE,
    message: WISHLIST_LIMIT_MESSAGE,
  });
};

export const isWishlistLimitError = (error: unknown): error is ApiError => {
  return isApiError(error) && error.code === WISHLIST_LIMIT_CODE;
};

export const isUploadInvalidError = (error: unknown): error is ApiError => {
  return isApiError(error) && error.code === UPLOAD_INVALID_CODE;
};

const WISH_IMAGE = "/screenshots/item-detail-390.jpg";
const WISH_IMAGE_ALT = "/screenshots/try-on-ivory-maxi-390.jpg";

export const mockWishes: WishItem[] = [
  {
    wishId: "wish_loafers01",
    name: "Black loafers",
    category: "SHOES",
    subcategory: "Loafers",
    image: { originalKey: "users/user-1/wishlist/uploads/loafers.jpg" },
    originalImageUrl: WISH_IMAGE,
    link: "https://example.com/black-loafers",
    price: { amount: 120, currency: "GBP" },
    notes: "For the office rotation.",
    createdAt: "2026-10-12T09:00:00.000Z",
    updatedAt: "2026-10-12T09:00:00.000Z",
  },
  {
    wishId: "wish_trench01",
    name: "Tan trench",
    category: "OUTERWEAR",
    image: { originalKey: "users/user-1/wishlist/uploads/trench.jpg" },
    originalImageUrl: WISH_IMAGE_ALT,
    link: "https://example.com/tan-trench",
    price: { amount: 189, currency: "GBP" },
    createdAt: "2026-10-11T14:00:00.000Z",
    updatedAt: "2026-10-11T14:00:00.000Z",
  },
  {
    wishId: "wish_scarf01",
    name: "Forest scarf",
    category: "ACCESSORY",
    notes: "Need a photo before this can move into a wardrobe.",
    createdAt: "2026-10-10T18:30:00.000Z",
    updatedAt: "2026-10-10T18:30:00.000Z",
  },
];

export const mockIncompleteWish: WishItem = {
  wishId: "wish_linen01",
  name: "Linen shirt",
  notes: "Needs a category and a photo.",
  createdAt: "2026-10-09T12:00:00.000Z",
  updatedAt: "2026-10-09T12:00:00.000Z",
};

const cloneWish = (wish: WishItem): WishItem => {
  return {
    ...wish,
    image: wish.image ? { ...wish.image } : undefined,
    price: wish.price ? { ...wish.price } : undefined,
  };
};

const delay = async (): Promise<void> => {
  await Promise.resolve();
};

const findWishIndex = (wishes: WishItem[], wishId: string): number => {
  return wishes.findIndex((wish) => wish.wishId === wishId);
};

const wishNotFoundError = (): ApiError => {
  return new ApiError({
    status: 404,
    code: WISH_NOT_FOUND_CODE,
    message: "Wish not found.",
  });
};

const acquireValidationError = (): ApiError => {
  return new ApiError({
    status: 400,
    code: VALIDATION_ERROR_CODE,
    message: "Wish needs a category and a photo before it can move into a wardrobe.",
  });
};

const applyCreateBody = (
  wish: WishItem,
  body: CreateWishRequest,
  now: string,
): WishItem => {
  wish.name = body.name.trim();
  wish.updatedAt = now;
  if (body.category) {
    wish.category = body.category;
  }
  if (body.subcategory) {
    wish.subcategory = body.subcategory;
  }
  if (body.link) {
    wish.link = body.link;
  }
  if (body.price) {
    wish.price = { ...body.price };
  }
  if (body.notes) {
    wish.notes = body.notes;
  }
  if (body.imageKey) {
    wish.image = { originalKey: body.imageKey };
    wish.originalImageUrl = WISH_IMAGE;
  }
  return wish;
};

const applyUpdateBody = (
  wish: WishItem,
  body: UpdateWishRequest,
  now: string,
): WishItem => {
  wish.updatedAt = now;
  if (body.name !== undefined) {
    wish.name = body.name.trim();
  }
  if (body.category !== undefined) {
    if (!body.category) {
      delete wish.category;
    } else {
      wish.category = body.category;
    }
  }
  if (body.subcategory !== undefined) {
    if (body.subcategory === null || body.subcategory === "") {
      delete wish.subcategory;
    } else {
      wish.subcategory = body.subcategory;
    }
  }
  if (body.link !== undefined) {
    if (body.link === null || body.link === "") {
      delete wish.link;
    } else {
      wish.link = body.link;
    }
  }
  if (body.price !== undefined) {
    if (body.price === null) {
      delete wish.price;
    } else {
      wish.price = { ...body.price };
    }
  }
  if (body.notes !== undefined) {
    if (body.notes === null || body.notes === "") {
      delete wish.notes;
    } else {
      wish.notes = body.notes;
    }
  }
  if (body.imageKey !== undefined) {
    if (body.imageKey === null || body.imageKey === "") {
      delete wish.image;
      delete wish.originalImageUrl;
    } else {
      wish.image = { originalKey: body.imageKey };
      wish.originalImageUrl = WISH_IMAGE;
    }
  }
  return wish;
};

const toAcquiredItem = (wish: WishItem, wardrobeId: string): ClothingItem => {
  const now = new Date().toISOString();
  return {
    itemId: `item_${wish.wishId}`,
    wardrobeId,
    name: wish.name,
    category: wish.category ?? "ACCESSORY",
    subcategory: wish.subcategory,
    colours: [],
    image: wish.image ? { originalKey: wish.image.originalKey } : undefined,
    originalImageUrl: wish.originalImageUrl,
    processingStatus: "READY",
    createdAt: now,
    updatedAt: now,
  };
};

type MockWishlistState = {
  wishes: WishItem[];
};

export type MockWishlistApiOptions = {
  wishes?: WishItem[];
};

export const createMockWishlistApi = (
  overrides: Partial<WishlistApi> = {},
  options: MockWishlistApiOptions = {},
): WishlistApi => {
  const state: MockWishlistState = {
    wishes: (options.wishes ?? mockWishes).map((wish) => cloneWish(wish)),
  };

  const api: WishlistApi = {
    listWishes: async (listOptions) => {
      await delay();
      const limit = Math.min(
        Math.max(listOptions?.limit ?? WISHLIST_PAGE_SIZE, 1),
        WISHLIST_PAGE_SIZE_MAX,
      );
      let wishes = state.wishes.map((wish) => cloneWish(wish));
      if (listOptions?.category) {
        wishes = wishes.filter((wish) => wish.category === listOptions.category);
      }

      const start = listOptions?.cursor
        ? wishes.findIndex((wish) => wish.wishId === listOptions.cursor) + 1
        : 0;
      const pageStart = Math.max(start, 0);
      const page = wishes.slice(pageStart, pageStart + limit);
      const hasMore = pageStart + limit < wishes.length;
      const last = page[page.length - 1];
      return {
        wishes: page,
        nextCursor: hasMore ? last?.wishId : undefined,
      };
    },
    getWish: async (wishId) => {
      await delay();
      const wish = state.wishes.find((entry) => entry.wishId === wishId);
      if (!wish) {
        throw wishNotFoundError();
      }
      return cloneWish(wish);
    },
    createWish: async (body) => {
      await delay();
      if (state.wishes.length >= WISHLIST_LIMIT) {
        throw wishlistLimitError();
      }

      const now = new Date().toISOString();
      const created: WishItem = {
        wishId: `wish_${crypto.randomUUID().slice(0, 8)}`,
        name: body.name.trim(),
        createdAt: now,
        updatedAt: now,
      };
      applyCreateBody(created, body, now);
      state.wishes = [created, ...state.wishes];
      return cloneWish(created);
    },
    updateWish: async (wishId, body) => {
      await delay();
      const index = findWishIndex(state.wishes, wishId);
      if (index < 0) {
        throw wishNotFoundError();
      }

      const updated = applyUpdateBody(
        cloneWish(state.wishes[index]!),
        body,
        new Date().toISOString(),
      );
      state.wishes[index] = updated;
      return cloneWish(updated);
    },
    deleteWish: async (wishId) => {
      await delay();
      const index = findWishIndex(state.wishes, wishId);
      if (index < 0) {
        throw wishNotFoundError();
      }
      state.wishes.splice(index, 1);
    },
    acquireWish: async (wishId, body) => {
      await delay();
      const index = findWishIndex(state.wishes, wishId);
      if (index < 0) {
        throw wishNotFoundError();
      }

      const wish = state.wishes[index]!;
      if (!isWishReadyToAcquire(wish)) {
        throw acquireValidationError();
      }

      const item = toAcquiredItem(wish, body.wardrobeId);
      state.wishes.splice(index, 1);
      return item;
    },
    createUpload: async (body) => {
      await delay();
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
      ];
      if (!allowedTypes.includes(body.contentType)) {
        throw new ApiError({
          status: 400,
          code: UPLOAD_INVALID_CODE,
          message: "That photo type is not supported.",
        });
      }
      if (
        typeof body.contentLength === "number" &&
        body.contentLength > 10 * 1024 * 1024
      ) {
        throw new ApiError({
          status: 400,
          code: UPLOAD_INVALID_CODE,
          message: "That photo is too large.",
        });
      }

      return {
        uploadUrl: "https://uploads.example.test/wishlist",
        objectKey: `users/user-1/wishlist/uploads/${crypto.randomUUID()}.jpg`,
        expiresIn: 900,
      };
    },
  };

  return {
    ...api,
    ...overrides,
  };
};

export const createEmptyWishlistApi = (
  overrides: Partial<WishlistApi> = {},
): WishlistApi => {
  return createMockWishlistApi(overrides, { wishes: [] });
};

export const createPendingWishlistApi = (): WishlistApi => {
  return createMockWishlistApi({
    listWishes: () => new Promise(() => undefined),
  });
};

export const createErrorWishlistApi = (
  error: ApiError = new ApiError({
    status: 500,
    code: "INTERNAL",
    message: "Server error",
  }),
): WishlistApi => {
  const reject = async (): Promise<never> => {
    throw error;
  };

  return {
    listWishes: reject,
    getWish: reject,
    createWish: reject,
    updateWish: reject,
    deleteWish: reject,
    acquireWish: reject,
    createUpload: reject,
  };
};

export const loadAllWishes = async (
  api: Pick<WishlistApi, "listWishes">,
): Promise<WishItem[]> => {
  const wishes: WishItem[] = [];
  let cursor: string | undefined;

  do {
    const page: WishList = await api.listWishes({
      limit: WISHLIST_PAGE_SIZE,
      cursor,
    });
    wishes.push(...page.wishes);
    cursor = page.nextCursor;
  } while (cursor);

  return wishes;
};

export const createLiveWishlistApi = (api: AuthenticatedApi): WishlistApi => {
  return {
    listWishes: async (listOptions) => {
      const response = await api.request<unknown>(
        getWishlistApiPath({
          limit: listOptions?.limit ?? WISHLIST_PAGE_SIZE,
          cursor: listOptions?.cursor,
          category: listOptions?.category,
        }),
      );
      return toWishList(response);
    },
    getWish: async (wishId) => {
      const response = await api.request<unknown>(getWishApiPath(wishId));
      return toWishItem(response);
    },
    createWish: async (body) => {
      const response = await api.request<unknown>(WISHLIST_API_PATH, {
        method: "POST",
        body,
      });
      return toWishItem(response);
    },
    updateWish: async (wishId, body) => {
      const response = await api.request<unknown>(getWishApiPath(wishId), {
        method: "PATCH",
        body,
      });
      return toWishItem(response);
    },
    deleteWish: async (wishId) => {
      await api.request(getWishApiPath(wishId), {
        method: "DELETE",
      });
    },
    acquireWish: async (wishId, body) => {
      const response = await api.request<unknown>(getAcquireWishApiPath(wishId), {
        method: "POST",
        body,
      });
      return toClothingItemFromAcquire(response);
    },
    createUpload: async (body) => {
      return api.request<CreateUploadResponse>(WISHLIST_UPLOADS_PATH, {
        method: "POST",
        body: {
          contentType: body.contentType,
          contentLength: body.contentLength,
          purpose: UPLOAD_PURPOSE_WISHLIST,
        },
      });
    },
  };
};

export const createWishlistApi = (
  api: AuthenticatedApi,
  useMock = isMockApi(),
): WishlistApi => {
  if (useMock) {
    return createMockWishlistApi();
  }

  return createLiveWishlistApi(api);
};
