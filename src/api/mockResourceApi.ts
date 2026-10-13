import { ApiError } from "./httpClient";
import type { ResourceApi } from "./resourceApi";
import type {
  AiProfile,
  ClothingItem,
  Entitlement,
  Outfit,
  Wardrobe,
} from "./resourceTypes";

const ITEM_IMAGE = "/screenshots/item-detail-390.jpg";
const OUTFIT_IMAGE = "/screenshots/try-on-ivory-maxi-390.jpg";
const PROFILE_IMAGE = "/screenshots/try-on-blue-mini-390.jpg";
const CATALOG_IMAGE = "/screenshots/try-on-rust-floral-390.jpg";

export const mockEntitlement: Entitlement = {
  userId: "user-1",
  tier: "PREMIUM",
  status: "ACTIVE",
  features: {
    unlimitedCatalog: true,
    aiTryOn: true,
    otherAi: true,
  },
  limits: null,
  usage: {
    wardrobes: 2,
    items: 2,
    outfits: 1,
  },
  store: "STRIPE",
  updatedAt: "2026-10-01T09:12:00.000Z",
};

export const mockWardrobes: Wardrobe[] = [
  {
    wardrobeId: "wd_weekend01",
    name: "Weekend closet",
    createdAt: "2026-09-03T18:35:00.000Z",
    updatedAt: "2026-10-01T09:12:00.000Z",
  },
  {
    wardrobeId: "wd_work02",
    name: "Workwear",
    createdAt: "2026-09-12T11:00:00.000Z",
    updatedAt: "2026-09-28T16:44:00.000Z",
  },
];

export const mockItems: ClothingItem[] = [
  {
    itemId: "item_navytee01",
    wardrobeId: "wd_weekend01",
    name: "Navy tee",
    category: "TOP",
    subcategory: "TSHIRT",
    colours: ["NAVY"],
    brand: "Example Brand",
    acquiredAt: "2026-04-12",
    image: {
      originalKey: "users/demo/items/navy-tee.jpg",
    },
    originalImageUrl: ITEM_IMAGE,
    processingStatus: "READY",
    createdAt: "2026-09-03T18:40:00.000Z",
    updatedAt: "2026-09-03T18:40:00.000Z",
  },
  {
    itemId: "item_ivorymaxi01",
    wardrobeId: "wd_weekend01",
    name: "Ivory maxi",
    category: "DRESS",
    subcategory: "DRESS",
    colours: ["CREAM"],
    image: {
      originalKey: "users/demo/items/ivory-maxi.jpg",
    },
    originalImageUrl: "/screenshots/try-on-ivory-maxi-390.jpg",
    processingStatus: "READY",
    createdAt: "2026-09-04T10:15:00.000Z",
    updatedAt: "2026-09-04T10:15:00.000Z",
  },
];

export const mockOutfits: Outfit[] = [
  {
    outfitId: "outfit_brunch01",
    wardrobeId: "wd_weekend01",
    name: "Sunday brunch",
    items: [
      { itemId: "item_navytee01", slot: "TOP" },
      { itemId: "item_ivorymaxi01", slot: "DRESS" },
    ],
    render: {
      status: "READY",
      aiProfileId: "aip_personal01",
      imageKey: "users/demo/renders/brunch.jpg",
      imageUrl: OUTFIT_IMAGE,
    },
    renderImageUrls: [OUTFIT_IMAGE],
    createdAt: "2026-09-20T14:00:00.000Z",
    updatedAt: "2026-09-21T08:30:00.000Z",
  },
];

export const mockAiProfiles: AiProfile[] = [
  {
    aiProfileId: "aip_personal01",
    type: "PERSONAL",
    referenceImages: ["users/demo/profiles/personal-front.jpg"],
    status: "READY",
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-18T09:00:00.000Z",
    label: "Weekday look",
    notes: "Used for Virtual Try On on weekdays.",
    frontImageUrl: PROFILE_IMAGE,
  },
  {
    aiProfileId: "aip_model01",
    type: "GENERIC_MODEL",
    referenceImages: ["shared/models/catalog-front.jpg"],
    status: "READY",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    label: "Catalog model",
    frontImageUrl: CATALOG_IMAGE,
  },
];

export type MockResourceApiOverrides = Partial<ResourceApi>;

const notFound = (code: string, message: string): ApiError => {
  return new ApiError({
    status: 404,
    code,
    message,
  });
};

const delay = async <T>(value: T): Promise<T> => {
  return value;
};

export const createMockResourceApi = (
  overrides: MockResourceApiOverrides = {},
): ResourceApi => {
  const getMe = async () => {
    return delay(mockEntitlement);
  };

  const listWardrobes = async () => {
    return delay({ wardrobes: mockWardrobes });
  };

  const getWardrobe = async (wardrobeId: string) => {
    const wardrobe = mockWardrobes.find(
      (entry) => entry.wardrobeId === wardrobeId,
    );
    if (!wardrobe) {
      throw notFound("WARDROBE_NOT_FOUND", "Wardrobe not found.");
    }

    return delay(wardrobe);
  };

  const listWardrobeItems = async (wardrobeId: string) => {
    const wardrobe = mockWardrobes.find(
      (entry) => entry.wardrobeId === wardrobeId,
    );
    if (!wardrobe) {
      throw notFound("WARDROBE_NOT_FOUND", "Wardrobe not found.");
    }

    return delay({
      items: mockItems.filter((item) => item.wardrobeId === wardrobeId),
    });
  };

  const getItem = async (itemId: string) => {
    const item = mockItems.find((entry) => entry.itemId === itemId);
    if (!item) {
      throw notFound("ITEM_NOT_FOUND", "Clothing item not found.");
    }

    return delay(item);
  };

  const getWardrobeDetail = async (wardrobeId: string) => {
    const wardrobe = await getWardrobe(wardrobeId);
    const { items } = await listWardrobeItems(wardrobeId);
    return { wardrobe, items };
  };

  const listOutfits = async () => {
    return delay({ outfits: mockOutfits });
  };

  const listAiProfiles = async () => {
    return delay({ aiProfiles: mockAiProfiles });
  };

  return {
    getMe,
    listWardrobes,
    getWardrobe,
    listWardrobeItems,
    getItem,
    getWardrobeDetail,
    listOutfits,
    listAiProfiles,
    ...overrides,
  };
};

export const createEmptyResourceApi = (): ResourceApi => {
  return createMockResourceApi({
    listWardrobes: async () => ({ wardrobes: [] }),
    listOutfits: async () => ({ outfits: [] }),
    listAiProfiles: async () => ({ aiProfiles: [] }),
    getWardrobeDetail: async (wardrobeId: string) => {
      const wardrobe = mockWardrobes.find(
        (entry) => entry.wardrobeId === wardrobeId,
      );
      if (!wardrobe) {
        throw notFound("WARDROBE_NOT_FOUND", "Wardrobe not found.");
      }

      return { wardrobe, items: [] };
    },
  });
};

export const createErrorResourceApi = (
  error: ApiError = new ApiError({
    status: 500,
    code: "INTERNAL",
    message: "Server error",
  }),
): ResourceApi => {
  const reject = async () => {
    throw error;
  };

  return {
    getMe: reject,
    listWardrobes: reject,
    getWardrobe: reject,
    listWardrobeItems: reject,
    getItem: reject,
    getWardrobeDetail: reject,
    listOutfits: reject,
    listAiProfiles: reject,
  };
};

export const createEntitlementAiRequiredResourceApi = (): ResourceApi => {
  return createErrorResourceApi(
    new ApiError({
      status: 403,
      code: "ENTITLEMENT_AI_REQUIRED",
      message: "Premium is required for Virtual Profiles.",
    }),
  );
};
