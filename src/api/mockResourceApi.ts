import { catalogLimitError, isAtCatalogLimit } from "./catalogLimits";
import { isAllowedUploadContentType } from "./catalogValidation";
import { ApiError } from "./httpClient";
import type { ListJobEventsOptions } from "./authenticatedApi";
import type { ListWardrobeItemsOptions, ResourceApi } from "./resourceApi";
import type {
  AccountDeleteResult,
  AiProfile,
  AttachAiProfileReferenceImagesRequest,
  ClothingItem,
  ContentWipeResult,
  CreateAiProfileRequest,
  CreateAiProfileUploadRequest,
  CreateItemRequest,
  CreateOutfitRequest,
  CreateRenderRequest,
  CreateUploadRequest,
  CreateUploadResponse,
  CreateWardrobeRequest,
  Entitlement,
  EntitlementLimits,
  JobEvent,
  Outfit,
  OutfitRender,
  UpdateAiProfileRequest,
  UpdateItemRequest,
  UpdateOutfitRequest,
  UpdateWardrobeRequest,
  Wardrobe,
} from "./resourceTypes";
import {
  ENTITLEMENT_AI_REQUIRED_CODE,
  UPLOAD_PURPOSE_AI_PROFILE_REFERENCE,
  UPLOAD_PURPOSE_WARDROBE_ITEM,
} from "./resourceTypes";

const ITEM_IMAGE = "/screenshots/item-detail-390.jpg";
const OUTFIT_IMAGE = "/screenshots/try-on-ivory-maxi-390.jpg";
const PROFILE_IMAGE = "/screenshots/try-on-blue-mini-390.jpg";
const CATALOG_IMAGE = "/screenshots/try-on-rust-floral-390.jpg";
export const WEEKEND_WARDROBE_IMAGE_URL = "/screenshots/home-390.jpg";
export const WORKWEAR_WARDROBE_COVER_IMAGE_URL =
  "/screenshots/item-detail-390.jpg";

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

export const mockFreeAtLimitEntitlement: Entitlement = {
  userId: "user-1",
  tier: "FREE",
  status: "NONE",
  features: {
    unlimitedCatalog: false,
    aiTryOn: false,
    otherAi: false,
  },
  limits: {
    wardrobes: 1,
    items: 5,
    outfits: 5,
  },
  usage: {
    wardrobes: 1,
    items: 5,
    outfits: 5,
  },
  updatedAt: "2026-10-01T09:12:00.000Z",
};

export const mockWardrobes: Wardrobe[] = [
  {
    wardrobeId: "wd_weekend01",
    name: "Weekend closet",
    createdAt: "2026-09-03T18:35:00.000Z",
    updatedAt: "2026-10-01T09:12:00.000Z",
    imageUrl: WEEKEND_WARDROBE_IMAGE_URL,
  },
  {
    wardrobeId: "wd_work02",
    name: "Workwear",
    createdAt: "2026-09-12T11:00:00.000Z",
    updatedAt: "2026-09-28T16:44:00.000Z",
    coverImageUrl: WORKWEAR_WARDROBE_COVER_IMAGE_URL,
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

export type MockResourceApiOptions = {
  entitlement?: Entitlement;
  wardrobes?: Wardrobe[];
  items?: ClothingItem[];
  outfits?: Outfit[];
  aiProfiles?: AiProfile[];
  jobEvents?: JobEvent[];
};

export const mockJobEvents: JobEvent[] = [
  {
    eventId: "evt_render01",
    type: "JOB_DONE",
    title: "Virtual Try On is ready",
    message: "Sunday brunch render finished.",
    createdAt: "2026-10-13T11:00:00.000Z",
  },
];

export const mockContentWipeResult: ContentWipeResult = {
  keepAccount: true,
  deletedWardrobes: 2,
  deletedItems: 2,
  deletedOutfits: 1,
  deletedAiProfiles: 1,
  deletedS3Objects: 3,
  s3Failures: 0,
};

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

const cloneWardrobe = (wardrobe: Wardrobe): Wardrobe => {
  return { ...wardrobe };
};

const cloneItem = (item: ClothingItem): ClothingItem => {
  return {
    ...item,
    colours: item.colours ? [...item.colours] : undefined,
    image: item.image ? { ...item.image } : undefined,
    ...(item.tags ? { tags: [...item.tags] } : {}),
  };
};

const cloneOutfit = (outfit: Outfit): Outfit => {
  return {
    ...outfit,
    items: outfit.items.map((entry) => ({ ...entry })),
    render: outfit.render ? { ...outfit.render } : undefined,
    renderHistory: outfit.renderHistory?.map((entry) => ({ ...entry })),
    renderImageUrls: outfit.renderImageUrls
      ? [...outfit.renderImageUrls]
      : undefined,
  };
};

const cloneAiProfile = (profile: AiProfile): AiProfile => {
  return {
    ...profile,
    referenceImages: [...profile.referenceImages],
    referenceImageUrls: profile.referenceImageUrls
      ? { ...profile.referenceImageUrls }
      : undefined,
  };
};

const cloneItemWithRender = (item: ClothingItem): ClothingItem => {
  return {
    ...cloneItem(item),
    render: item.render ? { ...item.render } : undefined,
    renderHistory: item.renderHistory?.map((entry) => ({ ...entry })),
    renderImageUrls: item.renderImageUrls
      ? [...item.renderImageUrls]
      : undefined,
  };
};

const cloneEntitlement = (entitlement: Entitlement): Entitlement => {
  return {
    ...entitlement,
    features: { ...entitlement.features },
    limits: entitlement.limits ? { ...entitlement.limits } : null,
    usage: { ...entitlement.usage },
  };
};

const nowIso = (): string => {
  return "2026-10-13T12:00:00.000Z";
};

const createLimitFillWardrobes = (count: number): Wardrobe[] => {
  return Array.from({ length: count }, (_, index) => {
    if (index === 0) {
      return cloneWardrobe(mockWardrobes[0]!);
    }

    return {
      wardrobeId: `wd_limit0${index + 1}`,
      name: `Limit wardrobe ${index + 1}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  });
};

const createLimitFillItems = (
  wardrobeId: string,
  count: number,
): ClothingItem[] => {
  return Array.from({ length: count }, (_, index) => {
    return {
      itemId: `item_limit0${index + 1}`,
      wardrobeId,
      name: `Limit item ${index + 1}`,
      category: "TOP",
      processingStatus: "READY",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  });
};

const createLimitFillOutfits = (
  wardrobeId: string,
  count: number,
): Outfit[] => {
  return Array.from({ length: count }, (_, index) => {
    return {
      outfitId: `outfit_limit0${index + 1}`,
      wardrobeId,
      name: `Limit outfit ${index + 1}`,
      items: [{ itemId: `item_limit0${index + 1}`, slot: "TOP" as const }],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  });
};

export const createMockResourceApi = (
  overrides: MockResourceApiOverrides = {},
  options: MockResourceApiOptions = {},
): ResourceApi => {
  const wardrobes = (options.wardrobes ?? mockWardrobes).map(cloneWardrobe);
  const items = (options.items ?? mockItems).map(cloneItemWithRender);
  const outfits = (options.outfits ?? mockOutfits).map(cloneOutfit);
  const aiProfiles = (options.aiProfiles ?? mockAiProfiles).map(cloneAiProfile);
  const jobEvents = (options.jobEvents ?? mockJobEvents).map((event) => ({
    ...event,
  }));
  let entitlement = cloneEntitlement(options.entitlement ?? mockEntitlement);
  let renderCount = 0;

  const syncUsage = () => {
    entitlement = {
      ...entitlement,
      usage: {
        wardrobes: wardrobes.length,
        items: items.length,
        outfits: outfits.length,
      },
    };
  };

  const assertCanCreate = (kind: "wardrobe" | "item" | "outfit") => {
    syncUsage();
    if (isAtCatalogLimit(entitlement, kind)) {
      throw catalogLimitError(kind, entitlement.limits);
    }
  };

  const entitlementAiRequired = (message: string): ApiError => {
    return new ApiError({
      status: 403,
      code: ENTITLEMENT_AI_REQUIRED_CODE,
      message,
    });
  };

  const assertAiTryOn = () => {
    if (!entitlement.features.aiTryOn) {
      throw entitlementAiRequired(
        "Premium is required for Virtual Try On.",
      );
    }
  };

  const assertOtherAi = () => {
    if (!entitlement.features.otherAi) {
      throw entitlementAiRequired(
        "Premium is required for Virtual Profiles.",
      );
    }
  };

  const applyReadyRender = <T extends ClothingItem | Outfit>(
    target: T,
    aiProfileId: string,
  ): T => {
    renderCount += 1;
    const imageUrl = `${OUTFIT_IMAGE}?render=${renderCount}`;
    const imageKey = `users/user-1/renders/rend_${renderCount}.png`;
    const timestamp = nowIso();
    const historyEntry = {
      imageKey,
      createdAt: timestamp,
      aiProfileId,
      imageUrl,
    };
    target.render = {
      status: "READY",
      aiProfileId,
      imageKey,
      imageUrl,
    };
    target.renderHistory = [historyEntry, ...(target.renderHistory ?? [])];
    target.renderImageUrls = [imageUrl, ...(target.renderImageUrls ?? [])];
    target.updatedAt = timestamp;
    return target;
  };

  const getMe = async () => {
    syncUsage();
    return delay(cloneEntitlement(entitlement));
  };

  const deleteAccount = async (): Promise<AccountDeleteResult> => {
    return delay({ deleted: true });
  };

  const clearContent = async (): Promise<ContentWipeResult> => {
    const result: ContentWipeResult = {
      keepAccount: true,
      deletedWardrobes: wardrobes.length,
      deletedItems: items.length,
      deletedOutfits: outfits.length,
      deletedAiProfiles: aiProfiles.length,
      deletedS3Objects: items.length + aiProfiles.length,
      s3Failures: 0,
    };
    wardrobes.splice(0, wardrobes.length);
    items.splice(0, items.length);
    outfits.splice(0, outfits.length);
    aiProfiles.splice(0, aiProfiles.length);
    syncUsage();
    return delay(result);
  };

  const listJobEvents = async (
    listOptions: ListJobEventsOptions = {},
  ) => {
    const unreadOnly = listOptions.unreadOnly !== false;
    const unreadEvents = jobEvents.filter((event) => !event.readAt);
    const events = unreadOnly ? unreadEvents : jobEvents;
    return delay({
      events: events.map((event) => ({ ...event })),
      unreadCount: unreadEvents.length,
    });
  };

  const listWardrobes = async () => {
    return delay({ wardrobes: wardrobes.map(cloneWardrobe) });
  };

  const getWardrobe = async (wardrobeId: string) => {
    const wardrobe = wardrobes.find((entry) => entry.wardrobeId === wardrobeId);
    if (!wardrobe) {
      throw notFound("WARDROBE_NOT_FOUND", "Wardrobe not found.");
    }

    return delay(cloneWardrobe(wardrobe));
  };

  const createWardrobe = async (body: CreateWardrobeRequest) => {
    assertCanCreate("wardrobe");
    const timestamp = nowIso();
    const wardrobe: Wardrobe = {
      wardrobeId: `wd_${wardrobes.length + 1}`,
      name: body.name.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    wardrobes.push(wardrobe);
    syncUsage();
    return delay(cloneWardrobe(wardrobe));
  };

  const updateWardrobe = async (
    wardrobeId: string,
    body: UpdateWardrobeRequest,
  ) => {
    const wardrobe = wardrobes.find((entry) => entry.wardrobeId === wardrobeId);
    if (!wardrobe) {
      throw notFound("WARDROBE_NOT_FOUND", "Wardrobe not found.");
    }

    wardrobe.name = body.name.trim();
    wardrobe.updatedAt = nowIso();
    return delay(cloneWardrobe(wardrobe));
  };

  const listWardrobeItems = async (
    wardrobeId: string,
    options: ListWardrobeItemsOptions = {},
  ) => {
    await getWardrobe(wardrobeId);
    const wardrobeItems = items
      .filter((item) => item.wardrobeId === wardrobeId)
      .map(cloneItem);
    const limit = options.limit;
    const limitedItems =
      typeof limit === "number" && Number.isFinite(limit) && limit >= 0
        ? wardrobeItems.slice(0, limit)
        : wardrobeItems;

    return delay({
      items: limitedItems,
    });
  };

  const getItem = async (itemId: string) => {
    const item = items.find((entry) => entry.itemId === itemId);
    if (!item) {
      throw notFound("ITEM_NOT_FOUND", "Clothing item not found.");
    }

    return delay(cloneItemWithRender(item));
  };

  const createItem = async (wardrobeId: string, body: CreateItemRequest) => {
    await getWardrobe(wardrobeId);
    assertCanCreate("item");
    const timestamp = nowIso();
    const item: ClothingItem = {
      itemId: `item_${items.length + 1}`,
      wardrobeId,
      name: body.name.trim(),
      category: body.category,
      subcategory: body.subcategory,
      colours: body.colours,
      brand: body.brand,
      acquiredAt: body.acquiredAt,
      image: { originalKey: body.imageKey },
      originalImageUrl: ITEM_IMAGE,
      processingStatus: "READY",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    items.push(item);
    syncUsage();
    return delay(cloneItem(item));
  };

  const updateItem = async (
    wardrobeId: string,
    itemId: string,
    body: UpdateItemRequest,
  ) => {
    const item = items.find(
      (entry) => entry.itemId === itemId && entry.wardrobeId === wardrobeId,
    );
    if (!item) {
      throw notFound("ITEM_NOT_FOUND", "Clothing item not found.");
    }

    if (body.name !== undefined) {
      item.name = body.name.trim();
    }
    if (body.category !== undefined) {
      item.category = body.category;
    }
    if (body.subcategory !== undefined) {
      item.subcategory = body.subcategory ?? undefined;
    }
    if (body.colours !== undefined) {
      item.colours = body.colours;
    }
    if (body.brand !== undefined) {
      item.brand = body.brand;
    }
    if (body.acquiredAt !== undefined) {
      item.acquiredAt = body.acquiredAt ?? undefined;
    }
    if (body.imageKey !== undefined) {
      item.image = { originalKey: body.imageKey };
      item.originalImageUrl = ITEM_IMAGE;
    }
    item.updatedAt = nowIso();
    return delay(cloneItem(item));
  };

  const deleteItem = async (wardrobeId: string, itemId: string) => {
    const index = items.findIndex(
      (entry) => entry.itemId === itemId && entry.wardrobeId === wardrobeId,
    );
    if (index < 0) {
      throw notFound("ITEM_NOT_FOUND", "Clothing item not found.");
    }

    items.splice(index, 1);
    syncUsage();
  };

  const getWardrobeDetail = async (wardrobeId: string) => {
    const wardrobe = await getWardrobe(wardrobeId);
    const { items: wardrobeItems } = await listWardrobeItems(wardrobeId);
    return { wardrobe, items: wardrobeItems };
  };

  const listOutfits = async () => {
    return delay({ outfits: outfits.map(cloneOutfit) });
  };

  const getOutfit = async (wardrobeId: string, outfitId: string) => {
    const outfit = outfits.find(
      (entry) =>
        entry.outfitId === outfitId && entry.wardrobeId === wardrobeId,
    );
    if (!outfit) {
      throw notFound("OUTFIT_NOT_FOUND", "Outfit not found.");
    }

    return delay(cloneOutfit(outfit));
  };

  const createOutfit = async (
    wardrobeId: string,
    body: CreateOutfitRequest,
  ) => {
    await getWardrobe(wardrobeId);
    assertCanCreate("outfit");
    const timestamp = nowIso();
    const outfit: Outfit = {
      outfitId: `outfit_${outfits.length + 1}`,
      wardrobeId,
      name: body.name.trim(),
      items: body.items.map((entry) => ({ ...entry })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    outfits.push(outfit);
    syncUsage();
    return delay(cloneOutfit(outfit));
  };

  const updateOutfit = async (
    wardrobeId: string,
    outfitId: string,
    body: UpdateOutfitRequest,
  ) => {
    const outfit = outfits.find(
      (entry) =>
        entry.outfitId === outfitId && entry.wardrobeId === wardrobeId,
    );
    if (!outfit) {
      throw notFound("OUTFIT_NOT_FOUND", "Outfit not found.");
    }

    if (body.name !== undefined) {
      outfit.name = body.name.trim();
    }
    if (body.items !== undefined) {
      outfit.items = body.items.map((entry) => ({ ...entry }));
    }
    outfit.updatedAt = nowIso();
    return delay(cloneOutfit(outfit));
  };

  const listAiProfiles = async () => {
    assertAiTryOn();
    return delay({
      aiProfiles: aiProfiles
        .filter((profile) => profile.type === "PERSONAL")
        .map(cloneAiProfile),
    });
  };

  const listGenericAiProfiles = async () => {
    return delay({
      aiProfiles: aiProfiles
        .filter((profile) => profile.type === "GENERIC_MODEL")
        .map(cloneAiProfile),
    });
  };

  const getAiProfile = async (aiProfileId: string) => {
    const profile = aiProfiles.find((entry) => entry.aiProfileId === aiProfileId);
    if (!profile) {
      throw notFound("AI_PROFILE_NOT_FOUND", "Virtual Profile not found.");
    }
    if (profile.type === "PERSONAL") {
      assertOtherAi();
    }

    return delay(cloneAiProfile(profile));
  };

  const createAiProfile = async (body: CreateAiProfileRequest) => {
    assertOtherAi();
    const timestamp = nowIso();
    const profile: AiProfile = {
      aiProfileId: `aip_${aiProfiles.length + 1}`,
      type: "PERSONAL",
      referenceImages: body.referenceImages ? [...body.referenceImages] : [],
      status: "READY",
      createdAt: timestamp,
      updatedAt: timestamp,
      label: body.label?.trim() || undefined,
      notes: body.notes?.trim() || undefined,
      frontImageUrl: body.referenceImages?.length ? PROFILE_IMAGE : undefined,
    };
    aiProfiles.push(profile);
    return delay(cloneAiProfile(profile));
  };

  const updateAiProfile = async (
    aiProfileId: string,
    body: UpdateAiProfileRequest,
  ) => {
    const profile = await getOwnedPersonalProfile(aiProfileId);
    assertOtherAi();
    if (body.label !== undefined) {
      profile.label = body.label?.trim() || undefined;
    }
    if (body.notes !== undefined) {
      profile.notes = body.notes?.trim() || undefined;
    }
    profile.updatedAt = nowIso();
    return delay(cloneAiProfile(profile));
  };

  const deleteAiProfile = async (aiProfileId: string) => {
    const profile = await getOwnedPersonalProfile(aiProfileId);
    assertOtherAi();
    const index = aiProfiles.findIndex(
      (entry) => entry.aiProfileId === profile.aiProfileId,
    );
    if (index >= 0) {
      aiProfiles.splice(index, 1);
    }
  };

  const getOwnedPersonalProfile = async (aiProfileId: string) => {
    const profile = aiProfiles.find((entry) => entry.aiProfileId === aiProfileId);
    if (!profile) {
      throw notFound("AI_PROFILE_NOT_FOUND", "Virtual Profile not found.");
    }
    if (profile.type !== "PERSONAL") {
      throw new ApiError({
        status: 403,
        code: "UNAUTHORIZED",
        message: "GENERIC_MODEL profiles cannot be updated.",
      });
    }

    return profile;
  };

  const createAiProfileUpload = async (
    aiProfileId: string,
    body: CreateAiProfileUploadRequest,
  ): Promise<CreateUploadResponse> => {
    await getOwnedPersonalProfile(aiProfileId);
    assertOtherAi();
    const contentType = body.contentType.trim().toLowerCase();
    if (
      body.purpose !== undefined &&
      body.purpose !== UPLOAD_PURPOSE_AI_PROFILE_REFERENCE
    ) {
      throw new ApiError({
        status: 400,
        code: "UPLOAD_INVALID",
        message: "purpose must be AI_PROFILE_REFERENCE.",
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

    return delay({
      uploadUrl: "https://uploads.example.com/presigned/profile.jpg",
      objectKey: `users/user-1/ai-profiles/${aiProfileId}/upl_mock.jpg`,
      expiresIn: 900,
    });
  };

  const attachAiProfileReferenceImages = async (
    aiProfileId: string,
    body: AttachAiProfileReferenceImagesRequest,
  ) => {
    const profile = await getOwnedPersonalProfile(aiProfileId);
    assertOtherAi();
    const incoming = [
      ...(body.objectKey ? [body.objectKey] : []),
      ...(body.objectKeys ?? []),
    ];
    if (incoming.length === 0) {
      throw new ApiError({
        status: 400,
        code: "VALIDATION_ERROR",
        message: "objectKey or objectKeys is required.",
      });
    }

    profile.referenceImages = [...profile.referenceImages, ...incoming];
    profile.mainImageKey = incoming[0];
    profile.frontImageUrl = PROFILE_IMAGE;
    profile.updatedAt = nowIso();
    return delay(cloneAiProfile(profile));
  };

  const renderItem = async (
    wardrobeId: string,
    itemId: string,
    body: CreateRenderRequest,
  ) => {
    assertAiTryOn();
    const item = items.find(
      (entry) => entry.itemId === itemId && entry.wardrobeId === wardrobeId,
    );
    if (!item) {
      throw notFound("ITEM_NOT_FOUND", "Clothing item not found.");
    }

    applyReadyRender(item, body.aiProfileId);
    return delay(cloneItemWithRender(item));
  };

  const renderOutfit = async (
    wardrobeId: string,
    outfitId: string,
    body: CreateRenderRequest,
  ) => {
    assertAiTryOn();
    const outfit = outfits.find(
      (entry) =>
        entry.outfitId === outfitId && entry.wardrobeId === wardrobeId,
    );
    if (!outfit) {
      throw notFound("OUTFIT_NOT_FOUND", "Outfit not found.");
    }

    applyReadyRender(outfit, body.aiProfileId);
    return delay(cloneOutfit(outfit));
  };

  const getCurrentRender = (render?: OutfitRender): OutfitRender => {
    if (!render) {
      throw notFound("RENDER_NOT_FOUND", "Virtual Try On is not ready yet.");
    }

    return { ...render };
  };

  const getItemRender = async (wardrobeId: string, itemId: string) => {
    const item = items.find(
      (entry) => entry.itemId === itemId && entry.wardrobeId === wardrobeId,
    );
    if (!item) {
      throw notFound("ITEM_NOT_FOUND", "Clothing item not found.");
    }

    return delay(getCurrentRender(item.render));
  };

  const getOutfitRender = async (wardrobeId: string, outfitId: string) => {
    const outfit = outfits.find(
      (entry) =>
        entry.outfitId === outfitId && entry.wardrobeId === wardrobeId,
    );
    if (!outfit) {
      throw notFound("OUTFIT_NOT_FOUND", "Outfit not found.");
    }

    return delay(getCurrentRender(outfit.render));
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

    const extension =
      contentType === "image/png"
        ? "png"
        : contentType === "image/webp"
          ? "webp"
          : contentType === "image/heic"
            ? "heic"
            : "jpg";

    return delay({
      uploadUrl: `https://uploads.example.com/presigned/${extension}`,
      objectKey: `users/user-1/uploads/upl_mock.${extension}`,
      expiresIn: 900,
    });
  };

  return {
    getMe,
    deleteAccount,
    clearContent,
    listJobEvents,
    listWardrobes,
    getWardrobe,
    createWardrobe,
    updateWardrobe,
    listWardrobeItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    getWardrobeDetail,
    listOutfits,
    getOutfit,
    createOutfit,
    updateOutfit,
    listAiProfiles,
    listGenericAiProfiles,
    getAiProfile,
    createAiProfile,
    updateAiProfile,
    deleteAiProfile,
    createAiProfileUpload,
    attachAiProfileReferenceImages,
    renderItem,
    renderOutfit,
    getItemRender,
    getOutfitRender,
    createUpload,
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

const rejectAll = (error: ApiError): ResourceApi => {
  const reject = async () => {
    throw error;
  };

  return {
    getMe: reject,
    deleteAccount: reject,
    clearContent: reject,
    listJobEvents: reject,
    listWardrobes: reject,
    getWardrobe: reject,
    createWardrobe: reject,
    updateWardrobe: reject,
    listWardrobeItems: reject,
    getItem: reject,
    createItem: reject,
    updateItem: reject,
    deleteItem: reject,
    getWardrobeDetail: reject,
    listOutfits: reject,
    getOutfit: reject,
    createOutfit: reject,
    updateOutfit: reject,
    listAiProfiles: reject,
    listGenericAiProfiles: reject,
    getAiProfile: reject,
    createAiProfile: reject,
    updateAiProfile: reject,
    deleteAiProfile: reject,
    createAiProfileUpload: reject,
    attachAiProfileReferenceImages: reject,
    renderItem: reject,
    renderOutfit: reject,
    getItemRender: reject,
    getOutfitRender: reject,
    createUpload: reject,
  };
};

export const createErrorResourceApi = (
  error: ApiError = new ApiError({
    status: 500,
    code: "INTERNAL",
    message: "Server error",
  }),
): ResourceApi => {
  return rejectAll(error);
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

export const mockAiTryOnOffEntitlement: Entitlement = {
  ...mockFreeAtLimitEntitlement,
  features: {
    unlimitedCatalog: true,
    aiTryOn: false,
    otherAi: false,
  },
  limits: null,
  usage: {
    wardrobes: 2,
    items: 2,
    outfits: 1,
  },
};

export const createAiTryOnOffResourceApi = (
  overrides: MockResourceApiOverrides = {},
): ResourceApi => {
  return createMockResourceApi(overrides, {
    entitlement: mockAiTryOnOffEntitlement,
  });
};

export const createOtherAiOffResourceApi = (
  overrides: MockResourceApiOverrides = {},
): ResourceApi => {
  return createMockResourceApi(overrides, {
    entitlement: {
      ...mockEntitlement,
      features: {
        unlimitedCatalog: true,
        aiTryOn: true,
        otherAi: false,
      },
    },
  });
};

export type FreeAtLimitOptions = {
  limits?: EntitlementLimits;
};

export const createFreeAtLimitResourceApi = (
  overrides: MockResourceApiOverrides = {},
  options: FreeAtLimitOptions = {},
): ResourceApi => {
  const limits = options.limits ?? mockFreeAtLimitEntitlement.limits;
  const wardrobes = createLimitFillWardrobes(limits?.wardrobes ?? 0);
  const firstWardrobeId = wardrobes[0]?.wardrobeId ?? mockWardrobes[0]!.wardrobeId;

  return createMockResourceApi(overrides, {
    entitlement: {
      ...mockFreeAtLimitEntitlement,
      limits: limits ? { ...limits } : null,
      usage: {
        wardrobes: limits?.wardrobes ?? 0,
        items: limits?.items ?? 0,
        outfits: limits?.outfits ?? 0,
      },
    },
    wardrobes,
    items: createLimitFillItems(firstWardrobeId, limits?.items ?? 0),
    outfits: createLimitFillOutfits(firstWardrobeId, limits?.outfits ?? 0),
  });
};
