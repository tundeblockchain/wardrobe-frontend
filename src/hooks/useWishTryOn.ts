import { useState } from "react";
import {
  canUseAiTryOn,
  getForbiddenUpgradeKind,
} from "../api/entitlementGating";
import { isApiError } from "../api/httpClient";
import type { ResourceApi } from "../api/resourceApi";
import type { Entitlement } from "../api/resourceTypes";
import { loadListedVirtualProfiles } from "../api/virtualProfiles";
import {
  canStartWishTryOn,
  getMissingTryOnDetails,
  pickReadyVirtualProfile,
} from "../api/wishTryOn";
import {
  isAiProfileNotFoundError,
  isWishCategoryRequiredError,
  isWishImageRequiredError,
  type WishItem,
  type WishlistApi,
} from "../api/wishlistApi";
import { dashboardCopy } from "../content/dashboardCopy";
import {
  isVirtualTryOnRenderFailed,
  pollVirtualTryOnRender,
  VIRTUAL_TRY_ON_MAX_POLL_ATTEMPTS,
  VIRTUAL_TRY_ON_POLL_INTERVAL_MS,
} from "../pages/app/virtualTryOnPoll";

export type WishTryOnPrompt =
  | "none"
  | "missing-image"
  | "missing-category"
  | "missing-both"
  | "missing-profile"
  | "paywall"
  | "failed";

export type UseWishTryOnOptions = {
  wish: WishItem;
  wishlistApi: Pick<
    WishlistApi,
    "renderWish" | "getWishRender" | "deleteWishRender" | "getWish"
  >;
  resourceApi: Pick<
    ResourceApi,
    "getMe" | "listAiProfiles" | "listGenericAiProfiles"
  >;
  pollIntervalMs?: number;
  maxPollAttempts?: number;
  onWishUpdated?: (wish: WishItem) => void;
};

const failedFallback = (): string => {
  return dashboardCopy.wishList.virtualTryOnFailedDescription;
};

const promptForMissing = (wish: WishItem): WishTryOnPrompt | undefined => {
  const missing = getMissingTryOnDetails(wish);
  if (missing.image && missing.category) {
    return "missing-both";
  }
  if (missing.image) {
    return "missing-image";
  }
  if (missing.category) {
    return "missing-category";
  }

  return undefined;
};

export const useWishTryOn = ({
  wish,
  wishlistApi,
  resourceApi,
  pollIntervalMs = VIRTUAL_TRY_ON_POLL_INTERVAL_MS,
  maxPollAttempts = VIRTUAL_TRY_ON_MAX_POLL_ATTEMPTS,
  onWishUpdated,
}: UseWishTryOnOptions) => {
  const copy = dashboardCopy.wishList;
  const [prompt, setPrompt] = useState<WishTryOnPrompt>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failedMessage, setFailedMessage] = useState<string | undefined>();
  const [entitlement, setEntitlement] = useState<Entitlement | undefined>();
  const [deletingImageKey, setDeletingImageKey] = useState<string | undefined>();
  const [deleteError, setDeleteError] = useState<string | undefined>();

  const updateWish = (next: WishItem) => {
    onWishUpdated?.(next);
  };

  const handleServerError = (error: unknown): boolean => {
    if (isWishImageRequiredError(error)) {
      setPrompt("missing-image");
      return true;
    }
    if (isWishCategoryRequiredError(error)) {
      setPrompt("missing-category");
      return true;
    }
    if (isAiProfileNotFoundError(error)) {
      setPrompt("missing-profile");
      return true;
    }
    if (getForbiddenUpgradeKind(error)) {
      setPrompt("paywall");
      return true;
    }

    return false;
  };

  const handleTryOn = async () => {
    if (isSubmitting) {
      return;
    }

    const missingPrompt = promptForMissing(wish);
    if (missingPrompt) {
      setPrompt(missingPrompt);
      return;
    }

    setPrompt("none");
    setFailedMessage(undefined);
    setDeleteError(undefined);

    try {
      const me = await resourceApi.getMe();
      setEntitlement(me);
      if (!canUseAiTryOn(me)) {
        setPrompt("paywall");
        return;
      }
    } catch (error) {
      if (handleServerError(error)) {
        return;
      }

      setPrompt("failed");
      setFailedMessage(isApiError(error) ? error.message : failedFallback());
      return;
    }

    let aiProfileId: string | undefined;
    try {
      const profiles = await loadListedVirtualProfiles(resourceApi);
      const profile = pickReadyVirtualProfile(profiles);
      if (!profile) {
        setPrompt("missing-profile");
        return;
      }

      aiProfileId = profile.aiProfileId;
    } catch (error) {
      if (handleServerError(error)) {
        return;
      }

      setPrompt("failed");
      setFailedMessage(isApiError(error) ? error.message : failedFallback());
      return;
    }

    setIsSubmitting(true);
    try {
      const posted = await wishlistApi.renderWish(wish.wishId, {
        aiProfileId,
      });
      updateWish(posted);

      const render = await pollVirtualTryOnRender(
        () => wishlistApi.getWishRender(wish.wishId),
        {
          initial: posted.render,
          intervalMs: pollIntervalMs,
          maxAttempts: maxPollAttempts,
        },
      );

      if (isVirtualTryOnRenderFailed(render)) {
        updateWish({ ...posted, render });
        setPrompt("failed");
        setFailedMessage(render.error?.trim() || failedFallback());
        return;
      }

      try {
        const refreshed = await wishlistApi.getWish(wish.wishId);
        updateWish(refreshed);
      } catch {
        updateWish({ ...posted, render });
      }

      setPrompt("none");
    } catch (error) {
      if (handleServerError(error)) {
        return;
      }

      setPrompt("failed");
      setFailedMessage(isApiError(error) ? error.message : failedFallback());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    void handleTryOn();
  };

  const handleDeletePhoto = async (imageKey: string) => {
    if (deletingImageKey || isSubmitting) {
      return;
    }

    setDeletingImageKey(imageKey);
    setDeleteError(undefined);
    try {
      await wishlistApi.deleteWishRender(wish.wishId, { imageKey });
      try {
        const refreshed = await wishlistApi.getWish(wish.wishId);
        updateWish(refreshed);
      } catch {
        const removed = wish.renderHistory?.find(
          (entry) => entry.imageKey === imageKey,
        );
        const nextHistory = (wish.renderHistory ?? []).filter(
          (entry) => entry.imageKey !== imageKey,
        );
        const nextUrls = (wish.renderImageUrls ?? []).filter(
          (url) => url !== removed?.imageUrl,
        );
        const nextWish: WishItem = { ...wish };
        if (nextHistory.length > 0) {
          nextWish.renderHistory = nextHistory;
        } else {
          delete nextWish.renderHistory;
        }
        if (nextUrls.length > 0) {
          nextWish.renderImageUrls = nextUrls;
        } else {
          delete nextWish.renderImageUrls;
        }
        if (wish.render?.imageKey === imageKey) {
          delete nextWish.render;
        }
        updateWish(nextWish);
      }
    } catch (error) {
      setDeleteError(
        isApiError(error)
          ? error.message
          : copy.virtualTryOnDeletePhotoErrorFallback,
      );
    } finally {
      setDeletingImageKey(undefined);
    }
  };

  return {
    prompt,
    isSubmitting,
    isBusy: isSubmitting || Boolean(deletingImageKey),
    failedMessage,
    entitlement,
    deletingImageKey,
    deleteError,
    canStart: canStartWishTryOn(wish),
    handleTryOn,
    handleRetry,
    handleDeletePhoto,
  };
};
