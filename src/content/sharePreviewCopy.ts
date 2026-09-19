import type { SharePreviewErrorKind } from "../api/sharePreview";

export type SharePreviewStatusCopy = {
  title: string;
  description: string;
};

export const SHARE_PREVIEW_STATUS_COPY: Record<
  SharePreviewErrorKind,
  SharePreviewStatusCopy
> = {
  not_found: {
    title: "This share isn't available",
    description:
      "The link may be incorrect, or this look is no longer shared. Download the app to start your own wardrobe.",
  },
  gone: {
    title: "This share has expired",
    description:
      "This look is no longer available. Ask the owner for a new link, or download the app to start your own wardrobe.",
  },
  network: {
    title: "Couldn't load this share",
    description: "Check your connection and try again.",
  },
  misconfigured: {
    title: "Couldn't load this share",
    description: "The preview service is temporarily unavailable.",
  },
};

export const getSharePreviewStatusCopy = (
  errorKind: SharePreviewErrorKind,
): SharePreviewStatusCopy => {
  return SHARE_PREVIEW_STATUS_COPY[errorKind];
};
