import { isMockApi } from "../config/mockApi";
import type { AuthenticatedApi } from "./authenticatedApi";
import {
  isAllowedUploadContentType,
  isClothingCategory,
  validateRequiredName,
  type FieldErrors,
} from "./catalogValidation";
import { ApiError, isApiError } from "./httpClient";
import {
  CLOTHING_CATEGORIES,
  UPLOAD_PURPOSE_WARDROBE_ITEM,
  type ClothingCategory,
  type ClothingItem,
  type CreateUploadRequest,
  type CreateUploadResponse,
} from "./resourceTypes";

/**
 * TODO(WARDROBE-244): Confirm these request/response shapes against the
 * backend contract in WARDROBE-244 before swapping this typed mock client
 * for the live API. Endpoints, field names, pagination, the 500-wish cap
 * error, acquire payload, and upload purpose must match that ticket.
 *
 * Agreed routes (subject to WARDROBE-244):
 * - GET    /wishlist
 * - POST   /wishlist
 * - PATCH  /wishlist/{id}
 * - DELETE /wishlist/{id}
 * - POST   /wishlist/{id}/acquire
 * - POST   /uploads (same presigned item-image upload as clothing items)
 */
export const WISHLIST_COLLECTION_PATH = "/wishlist";

export const WISHLIST_MAX_ITEMS = 500;
export const WISH_NOTES_MAX_LENGTH = 500;
export const WISHLIST_PAGE_SIZE = 50;
export const WISHLIST_LIMIT_CODE = "WISHLIST_LIMIT";
export const WISH_NOT_FOUND_CODE = "WISH_NOT_FOUND";

export const WISH_CURRENCIES = [
  "GBP",
  "USD",
  "EUR",
  "CAD",
  "AUD",
  "NZD",
  "JPY",
  "CHF",
  "SEK",
  "NOK",
  "DKK",
  "INR",
] as const;

export type WishCurrency = (typeof WISH_CURRENCIES)[number];

export type WishItem = {
  wishId: string;
  name: string;
  category?: ClothingCategory;
  subcategory?: string;
  imageKey?: string;
  imageUrl?: string;
  linkUrl?: string;
  price?: number;
  currency?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type WishList = {
  wishes: WishItem[];
  nextCursor?: string;
};

export type ListWishesOptions = {
  cursor?: string;
  limit?: number;
  category?: ClothingCategory;
};

export type CreateWishRequest = {
  name: string;
  category?: ClothingCategory;
  subcategory?: string;
  imageKey?: string;
  linkUrl?: string;
  price?: number;
  currency?: string;
  notes?: string;
};

export type UpdateWishRequest = {
  name?: string;
  category?: ClothingCategory | null;
  subcategory?: string | null;
  imageKey?: string;
  linkUrl?: string | null;
  price?: number | null;
  currency?: string | null;
  notes?: string | null;
};

export type AcquireWishRequest = {
  wardrobeId: string;
};

export type AcquireWishResponse = {
  wishId: string;
  wardrobeId: string;
  item: ClothingItem;
};

export type WishFormValues = {
  name: string;
  category: string;
  subcategory: string;
  linkUrl: string;
  price: string;
  currency: string;
  notes: string;
};

export type WishFormField =
  | "name"
  | "category"
  | "linkUrl"
  | "price"
  | "currency"
  | "notes"
  | "image";

export type WishlistApi = {
  listWishes: (options?: ListWishesOptions) => Promise<WishList>;
  createWish: (body: CreateWishRequest) => Promise<WishItem>;
  updateWish: (wishId: string, body: UpdateWishRequest) => Promise<WishItem>;
  deleteWish: (wishId: string) => Promise<void>;
  acquireWish: (
    wishId: string,
    body: AcquireWishRequest,
  ) => Promise<AcquireWishResponse>;
  createUpload: (body: CreateUploadRequest) => Promise<CreateUploadResponse>;
};

export const getWishlistApiPath = (options: ListWishesOptions = {}): string => {
  const params = new URLSearchParams();
  if (options.cursor?.trim()) {
    params.set("cursor", options.cursor.trim());
  }
  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }
  if (options.category) {
    params.set("category", options.category);
  }

  const query = params.toString();
  return query ? `${WISHLIST_COLLECTION_PATH}?${query}` : WISHLIST_COLLECTION_PATH;
};

export const getWishApiPath = (wishId: string): string => {
  return `${WISHLIST_COLLECTION_PATH}/${encodeURIComponent(wishId)}`;
};

export const getWishAcquireApiPath = (wishId: string): string => {
  return `${getWishApiPath(wishId)}/acquire`;
};

export const toWishList = (value: unknown): WishList => {
  if (Array.isArray(value)) {
    return { wishes: value as WishItem[] };
  }

  if (value && typeof value === "object") {
    const raw = value as {
      wishes?: unknown;
      items?: unknown;
      nextCursor?: unknown;
    };
    const rows = Array.isArray(raw.wishes)
      ? raw.wishes
      : Array.isArray(raw.items)
        ? raw.items
        : [];
    return {
      wishes: rows as WishItem[],
      nextCursor:
        typeof raw.nextCursor === "string" && raw.nextCursor.trim().length > 0
          ? raw.nextCursor
          : undefined,
    };
  }

  return { wishes: [] };
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

export const getWishImageUrl = (wish: WishItem): string | undefined => {
  const imageUrl = wish.imageUrl?.trim();
  return imageUrl && imageUrl.length > 0 ? imageUrl : undefined;
};

export const getSafeWishLinkUrl = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  return isHttpsUrl(value) ? value.trim() : undefined;
};

export const formatWishPrice = (
  price: number | undefined,
  currency: string | undefined,
): string | undefined => {
  if (price === undefined || !Number.isFinite(price)) {
    return undefined;
  }

  const code = currency?.trim().toUpperCase();
  if (code && /^[A-Z]{3}$/.test(code)) {
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: code,
      }).format(price);
    } catch {
      return `${code} ${price}`;
    }
  }

  return String(price);
};

export const parseWishPrice = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
};

export const validateWishForm = (
  values: WishFormValues,
): FieldErrors<WishFormField> => {
  const errors: FieldErrors<WishFormField> = {};
  const nameError = validateRequiredName(values.name);
  if (nameError) {
    errors.name = nameError;
  }

  const category = values.category.trim();
  if (category.length > 0 && !isClothingCategory(category)) {
    errors.category = `Category must be one of: ${CLOTHING_CATEGORIES.join(", ")}.`;
  }

  if (!isAllowedWishLink(values.linkUrl)) {
    errors.linkUrl = "Enter an https:// link.";
  }

  const price = values.price.trim();
  if (price.length > 0) {
    const parsed = Number(price);
    if (!Number.isFinite(parsed) || parsed < 0) {
      errors.price = "Enter a price of 0 or more.";
    }
  }

  const currency = values.currency.trim().toUpperCase();
  if (currency.length > 0 && !/^[A-Z]{3}$/.test(currency)) {
    errors.currency = "Currency must be a 3-letter code.";
  }

  const notes = values.notes.trim();
  if (notes.length > WISH_NOTES_MAX_LENGTH) {
    errors.notes = `Notes must be ${WISH_NOTES_MAX_LENGTH} characters or fewer.`;
  }

  return errors;
};

export const isWishlistLimitError = (error: unknown): error is ApiError => {
  return isApiError(error) && error.code === WISHLIST_LIMIT_CODE;
};

export const wishlistLimitError = (): ApiError => {
  return new ApiError({
    status: 400,
    code: WISHLIST_LIMIT_CODE,
    message: "Wish list can hold 500 pieces. Remove one to add another.",
  });
};

export const wishNotFoundError = (): ApiError => {
  return new ApiError({
    status: 404,
    code: WISH_NOT_FOUND_CODE,
    message: "Wish not found.",
  });
};

export const valuesFromWish = (wish: WishItem): WishFormValues => {
  return {
    name: wish.name,
    category: wish.category ?? "",
    subcategory: wish.subcategory ?? "",
    linkUrl: wish.linkUrl ?? "",
    price: wish.price === undefined ? "" : String(wish.price),
    currency: wish.currency ?? "",
    notes: wish.notes ?? "",
  };
};

export const EMPTY_WISH_FORM_VALUES: WishFormValues = {
  name: "",
  category: "",
  subcategory: "",
  linkUrl: "",
  price: "",
  currency: "",
  notes: "",
};

export const toCreateWishRequest = (values: WishFormValues, imageKey?: string): CreateWishRequest => {
  const body: CreateWishRequest = {
    name: values.name.trim(),
  };
  if (isClothingCategory(values.category.trim())) {
    body.category = values.category.trim() as ClothingCategory;
  }
  const subcategory = values.subcategory.trim();
  if (subcategory) {
    body.subcategory = subcategory;
  }
  const linkUrl = values.linkUrl.trim();
  if (linkUrl) {
    body.linkUrl = linkUrl;
  }
  const price = parseWishPrice(values.price);
  if (price !== undefined) {
    body.price = price;
  }
  const currency = values.currency.trim().toUpperCase();
  if (currency) {
    body.currency = currency;
  }
  const notes = values.notes.trim();
  if (notes) {
    body.notes = notes;
  }
  if (imageKey) {
    body.imageKey = imageKey;
  }

  return body;
};

const WISH_IMAGE = "/screenshots/item-detail-390.jpg";
const WISH_IMAGE_ALT = "/screenshots/try-on-ivory-maxi-390.jpg";

export const mockWishes: WishItem[] = [
  {
    wishId: "wish_loafers01",
    name: "Black loafers",
    category: "SHOES",
    subcategory: "LOAFER",
    imageKey: "users/demo/wishes/black-loafers.jpg",
    imageUrl: WISH_IMAGE,
    linkUrl: "https://example.com/black-loafers",
    price: 145,
    currency: "GBP",
    notes: "For work days.",
    createdAt: "2026-10-12T09:00:00.000Z",
    updatedAt: "2026-10-12T09:00:00.000Z",
  },
  {
    wishId: "wish_trench01",
    name: "Tan trench",
    category: "OUTERWEAR",
    subcategory: "COAT",
    imageKey: "users/demo/wishes/tan-trench.jpg",
    imageUrl: WISH_IMAGE_ALT,
    linkUrl: "https://example.com/tan-trench",
    price: 189,
    currency: "GBP",
    createdAt: "2026-10-08T11:20:00.000Z",
    updatedAt: "2026-10-08T11:20:00.000Z",
  },
  {
    wishId: "wish_scarf01",
    name: "Forest scarf",
    category: "ACCESSORY",
    notes: "No photo yet.",
    createdAt: "2026-09-30T16:10:00.000Z",
    updatedAt: "2026-09-30T16:10:00.000Z",
  },
];

export type MockWishlistApiOverrides = Partial<WishlistApi>;

export type MockWishlistApiOptions = {
  wishes?: WishItem[];
};

const cloneWish = (wish: WishItem): WishItem => {
  return { ...wish };
};

const nowIso = (): string => {
  return "2026-10-13T12:00:00.000Z";
};

const compareNewestFirst = (left: WishItem, right: WishItem): number => {
  if (left.createdAt === right.createdAt) {
    return right.wishId.localeCompare(left.wishId);
  }

  return right.createdAt.localeCompare(left.createdAt);
};

export const createMockWishlistApi = (
  overrides: MockWishlistApiOverrides = {},
  options: MockWishlistApiOptions = {},
): WishlistApi => {
  const wishes = (options.wishes ?? mockWishes).map(cloneWish);

  const listWishes = async (listOptions: ListWishesOptions = {}): Promise<WishList> => {
    const filtered = wishes
      .filter((wish) => {
        if (!listOptions.category) {
          return true;
        }

        return wish.category === listOptions.category;
      })
      .slice()
      .sort(compareNewestFirst);

    const limit =
      typeof listOptions.limit === "number" && Number.isFinite(listOptions.limit)
        ? Math.max(0, listOptions.limit)
        : WISHLIST_PAGE_SIZE;
    const cursorOffset = Number.parseInt(listOptions.cursor ?? "0", 10);
    const offset = Number.isFinite(cursorOffset) && cursorOffset > 0 ? cursorOffset : 0;
    const page = filtered.slice(offset, offset + limit);
    const nextOffset = offset + page.length;
    return {
      wishes: page.map(cloneWish),
      nextCursor: nextOffset < filtered.length ? String(nextOffset) : undefined,
    };
  };

  const findWish = (wishId: string): WishItem => {
    const wish = wishes.find((entry) => entry.wishId === wishId);
    if (!wish) {
      throw wishNotFoundError();
    }

    return wish;
  };

  const createWish = async (body: CreateWishRequest): Promise<WishItem> => {
    if (wishes.length >= WISHLIST_MAX_ITEMS) {
      throw wishlistLimitError();
    }

    const timestamp = nowIso();
    const wish: WishItem = {
      wishId: `wish_${wishes.length + 1}`,
      name: body.name.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    if (body.category) {
      wish.category = body.category;
    }
    if (body.subcategory) {
      wish.subcategory = body.subcategory;
    }
    if (body.linkUrl) {
      wish.linkUrl = body.linkUrl;
    }
    if (body.price !== undefined) {
      wish.price = body.price;
    }
    if (body.currency) {
      wish.currency = body.currency;
    }
    if (body.notes) {
      wish.notes = body.notes;
    }
    if (body.imageKey) {
      wish.imageKey = body.imageKey;
      wish.imageUrl = WISH_IMAGE;
    }

    wishes.unshift(wish);
    return cloneWish(wish);
  };

  const updateWish = async (
    wishId: string,
    body: UpdateWishRequest,
  ): Promise<WishItem> => {
    const wish = findWish(wishId);
    if (body.name !== undefined) {
      wish.name = body.name.trim();
    }
    if (body.category !== undefined) {
      wish.category = body.category ?? undefined;
    }
    if (body.subcategory !== undefined) {
      wish.subcategory = body.subcategory ?? undefined;
    }
    if (body.linkUrl !== undefined) {
      wish.linkUrl = body.linkUrl ?? undefined;
    }
    if (body.price !== undefined) {
      wish.price = body.price ?? undefined;
    }
    if (body.currency !== undefined) {
      wish.currency = body.currency ?? undefined;
    }
    if (body.notes !== undefined) {
      wish.notes = body.notes ?? undefined;
    }
    if (body.imageKey !== undefined) {
      wish.imageKey = body.imageKey;
      wish.imageUrl = WISH_IMAGE;
    }
    wish.updatedAt = nowIso();
    return cloneWish(wish);
  };

  const deleteWish = async (wishId: string): Promise<void> => {
    const index = wishes.findIndex((entry) => entry.wishId === wishId);
    if (index < 0) {
      throw wishNotFoundError();
    }

    wishes.splice(index, 1);
  };

  const acquireWish = async (
    wishId: string,
    body: AcquireWishRequest,
  ): Promise<AcquireWishResponse> => {
    const wish = findWish(wishId);
    const wardrobeId = body.wardrobeId.trim();
    if (!wardrobeId) {
      throw new ApiError({
        status: 400,
        code: "VALIDATION_ERROR",
        message: "wardrobeId is required.",
      });
    }

    const timestamp = nowIso();
    const item: ClothingItem = {
      itemId: `item_from_wish_${wish.wishId}`,
      wardrobeId,
      name: wish.name,
      category: wish.category ?? "ACCESSORY",
      subcategory: wish.subcategory,
      notes: wish.notes,
      image: wish.imageKey ? { originalKey: wish.imageKey } : undefined,
      originalImageUrl: wish.imageUrl,
      processingStatus: "READY",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const index = wishes.findIndex((entry) => entry.wishId === wish.wishId);
    if (index >= 0) {
      wishes.splice(index, 1);
    }

    return {
      wishId: wish.wishId,
      wardrobeId,
      item,
    };
  };

  const createUpload = async (
    body: CreateUploadRequest,
  ): Promise<CreateUploadResponse> => {
    const contentType = body.contentType.trim().toLowerCase();
    if (body.purpose !== UPLOAD_PURPOSE_WARDROBE_ITEM) {
      throw new ApiError({
        status: 400,
        code: "UPLOAD_INVALID",
        message: "purpose must be WARDROBE_ITEM.",
      });
    }
    if (!isAllowedUploadContentType(contentType)) {
      throw new ApiError({
        status: 400,
        code: "UPLOAD_INVALID",
        message:
          "Unsupported content type. Use image/jpeg, image/png, image/webp, or image/heic.",
      });
    }

    return {
      uploadUrl: "https://uploads.example.com/presigned/wish.jpg",
      objectKey: "users/user-1/uploads/upl_wish.jpg",
      expiresIn: 900,
    };
  };

  return {
    listWishes,
    createWish,
    updateWish,
    deleteWish,
    acquireWish,
    createUpload,
    ...overrides,
  };
};

export const createEmptyWishlistApi = (): WishlistApi => {
  return createMockWishlistApi({}, { wishes: [] });
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
  const reject = async () => {
    throw error;
  };

  return {
    listWishes: reject,
    createWish: reject,
    updateWish: reject,
    deleteWish: reject,
    acquireWish: reject,
    createUpload: reject,
  };
};

export const createLiveWishlistApi = (api: AuthenticatedApi): WishlistApi => {
  const listWishes = async (options: ListWishesOptions = {}): Promise<WishList> => {
    const payload = await api.request<unknown>(getWishlistApiPath(options));
    return toWishList(payload);
  };

  const createWish = (body: CreateWishRequest): Promise<WishItem> => {
    return api.request<WishItem>(WISHLIST_COLLECTION_PATH, {
      method: "POST",
      body,
    });
  };

  const updateWish = (wishId: string, body: UpdateWishRequest): Promise<WishItem> => {
    return api.request<WishItem>(getWishApiPath(wishId), {
      method: "PATCH",
      body,
    });
  };

  const deleteWish = async (wishId: string): Promise<void> => {
    await api.request<unknown>(getWishApiPath(wishId), {
      method: "DELETE",
    });
  };

  const acquireWish = (
    wishId: string,
    body: AcquireWishRequest,
  ): Promise<AcquireWishResponse> => {
    return api.request<AcquireWishResponse>(getWishAcquireApiPath(wishId), {
      method: "POST",
      body,
    });
  };

  const createUpload = (body: CreateUploadRequest): Promise<CreateUploadResponse> => {
    return api.request<CreateUploadResponse>("/uploads", {
      method: "POST",
      body,
    });
  };

  return {
    listWishes,
    createWish,
    updateWish,
    deleteWish,
    acquireWish,
    createUpload,
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

export const loadAllWishes = async (
  wishlistApi: Pick<WishlistApi, "listWishes">,
  options: Omit<ListWishesOptions, "cursor"> = {},
): Promise<WishItem[]> => {
  const wishes: WishItem[] = [];
  let cursor: string | undefined;

  do {
    const page = await wishlistApi.listWishes({
      ...options,
      cursor,
      limit: options.limit ?? WISHLIST_PAGE_SIZE,
    });
    wishes.push(...page.wishes);
    cursor = page.nextCursor;
  } while (cursor && wishes.length < WISHLIST_MAX_ITEMS);

  return wishes;
};
