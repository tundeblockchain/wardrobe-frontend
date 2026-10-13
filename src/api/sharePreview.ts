import { isApiError, joinApiUrl } from "./httpClient";
import { publicRequest } from "./publicApi";

export const SHARE_RESOURCE_TYPES = ["ITEM", "OUTFIT"] as const;

export type ShareResourceType = (typeof SHARE_RESOURCE_TYPES)[number];

export type SharePreview = {
  resourceType: ShareResourceType;
  title: string;
  imageUrl?: string;
  expiresAt: string;
};

export type SharePreviewErrorKind =
  | "not_found"
  | "gone"
  | "network"
  | "misconfigured";

export type SharePreviewQueryResult =
  | { status: "ok"; preview: SharePreview }
  | { status: SharePreviewErrorKind };

export type FetchSharePreviewInput = {
  apiBaseUrl: string | undefined;
  token: string | undefined;
  fetchImpl?: typeof fetch;
};

export const SHARE_RESOURCE_TYPE_LABELS: Record<ShareResourceType, string> = {
  ITEM: "Item",
  OUTFIT: "Outfit",
};

export const getShareResourceTypeLabel = (
  resourceType: ShareResourceType,
): string => {
  return SHARE_RESOURCE_TYPE_LABELS[resourceType];
};

export const getPublicSharePreviewUrl = (
  apiBaseUrl: string,
  token: string,
): string => {
  return joinApiUrl(
    apiBaseUrl,
    `/public/shares/${encodeURIComponent(token)}`,
  );
};

const isShareResourceType = (value: unknown): value is ShareResourceType => {
  return (
    typeof value === "string" &&
    (SHARE_RESOURCE_TYPES as readonly string[]).includes(value)
  );
};

const readOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return undefined;
  }

  return trimmedValue;
};

export const parseSharePreview = (value: unknown): SharePreview | undefined => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  if (!isShareResourceType(record.resourceType)) {
    return undefined;
  }

  const title = readOptionalString(record.title);
  const expiresAt = readOptionalString(record.expiresAt);
  if (!title || !expiresAt) {
    return undefined;
  }

  const preview: SharePreview = {
    resourceType: record.resourceType,
    title,
    expiresAt,
  };

  const imageUrl = readOptionalString(record.imageUrl);
  if (imageUrl) {
    preview.imageUrl = imageUrl;
  }

  return preview;
};

export const fetchSharePreview = async ({
  apiBaseUrl,
  token,
  fetchImpl = fetch,
}: FetchSharePreviewInput): Promise<SharePreviewQueryResult> => {
  const trimmedToken = token?.trim();
  if (!trimmedToken) {
    return { status: "not_found" };
  }

  if (!apiBaseUrl) {
    return { status: "misconfigured" };
  }

  try {
    const payload = await publicRequest<unknown>(
      getPublicSharePreviewUrl(apiBaseUrl, trimmedToken),
      {
        method: "GET",
        fetchImpl,
      },
    );
    const preview = parseSharePreview(payload);
    if (!preview) {
      return { status: "network" };
    }

    return { status: "ok", preview };
  } catch (error) {
    if (isApiError(error)) {
      if (error.status === 404) {
        return { status: "not_found" };
      }

      if (error.status === 410) {
        return { status: "gone" };
      }
    }

    return { status: "network" };
  }
};
