import { useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Typography } from "@mui/material";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { getWishTryOnPhotos } from "../../api/wishTryOn";
import type { Entitlement } from "../../api/resourceTypes";
import type { WishItem } from "../../api/wishlistApi";
import { dashboardCopy } from "../../content/dashboardCopy";
import type { WishTryOnPrompt } from "../../hooks/useWishTryOn";
import { VirtualTryOnProgress } from "../../pages/app/VirtualTryOnProgress";
import { VirtualTryOnResultCard } from "../../pages/app/VirtualTryOnResultCard";
import { ForbiddenUpgradePrompt } from "./ForbiddenUpgradePrompt";
import { WishTryOnFailedState } from "./WishTryOnFailedState";
import { WishTryOnGallery } from "./WishTryOnGallery";
import { WishTryOnMissingDetailsPrompt } from "./WishTryOnMissingDetailsPrompt";
import { WishTryOnProfilePrompt } from "./WishTryOnProfilePrompt";

export type WishTryOnPanelProps = {
  wish: WishItem;
  prompt: WishTryOnPrompt;
  isSubmitting: boolean;
  failedMessage?: string;
  entitlement?: Entitlement;
  deletingImageKey?: string;
  deleteError?: string;
  onEdit: () => void;
  onRetry: () => void;
  onDeletePhoto: (imageKey: string) => void;
};

export const WishTryOnPanel = ({
  wish,
  prompt,
  isSubmitting,
  failedMessage,
  entitlement,
  deletingImageKey,
  deleteError,
  onEdit,
  onRetry,
  onDeletePhoto,
}: WishTryOnPanelProps) => {
  const copy = dashboardCopy.wishList;
  const [pendingLatestKey, setPendingLatestKey] = useState<string | undefined>();
  const photos = getWishTryOnPhotos(wish);
  const latest = photos[0];
  const historyPhotos = photos.slice(1);
  const missing = {
    category: prompt === "missing-category" || prompt === "missing-both",
    image: prompt === "missing-image" || prompt === "missing-both",
  };

  const handleAskDeleteLatest = () => {
    if (!latest?.imageKey) {
      return;
    }

    setPendingLatestKey(latest.imageKey);
  };

  const handleCloseDeleteLatest = () => {
    if (deletingImageKey) {
      return;
    }

    setPendingLatestKey(undefined);
  };

  const handleConfirmDeleteLatest = () => {
    if (!pendingLatestKey) {
      return;
    }

    onDeletePhoto(pendingLatestKey);
    setPendingLatestKey(undefined);
  };

  return (
    <Stack spacing={2}>
      {prompt === "paywall" ? (
        <ForbiddenUpgradePrompt kind="premium" entitlement={entitlement} />
      ) : null}
      {prompt === "missing-profile" ? <WishTryOnProfilePrompt /> : null}
      {prompt === "missing-image" ||
      prompt === "missing-category" ||
      prompt === "missing-both" ? (
        <WishTryOnMissingDetailsPrompt missing={missing} onEdit={onEdit} />
      ) : null}
      {prompt === "failed" ? (
        <WishTryOnFailedState
          message={failedMessage}
          onRetry={onRetry}
          isBusy={isSubmitting}
        />
      ) : null}
      {isSubmitting ? (
        <VirtualTryOnProgress label={copy.virtualTryOnCreatingLabel} />
      ) : null}
      {!isSubmitting && latest ? (
        <Stack spacing={1}>
          <VirtualTryOnResultCard
            imageUrls={[latest.imageUrl]}
            resultLabel={copy.virtualTryOnResultLabel}
          />
          {latest.imageKey ? (
            <Box>
              <IconButton
                type="button"
                color="error"
                onClick={handleAskDeleteLatest}
                tabIndex={0}
                aria-label={`${copy.virtualTryOnDeletePhotoAriaLabel} 1`}
                disabled={Boolean(deletingImageKey)}
              >
                <DeleteOutlined aria-hidden="true" />
              </IconButton>
            </Box>
          ) : null}
        </Stack>
      ) : null}
      {pendingLatestKey ? (
        <Dialog
          open
          onClose={handleCloseDeleteLatest}
          aria-labelledby="delete-latest-try-on-photo-title"
        >
          <DialogTitle id="delete-latest-try-on-photo-title">
            {copy.virtualTryOnDeletePhotoConfirmTitle}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              {copy.virtualTryOnDeletePhotoConfirmDescription}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={handleCloseDeleteLatest}
              color="secondary"
              tabIndex={0}
              aria-label={copy.cancelLabel}
            >
              {copy.cancelLabel}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDeleteLatest}
              color="error"
              variant="contained"
              tabIndex={0}
              aria-label={copy.virtualTryOnDeletePhotoConfirmLabel}
            >
              {copy.virtualTryOnDeletePhotoConfirmLabel}
            </Button>
          </DialogActions>
        </Dialog>
      ) : null}
      {!isSubmitting ? (
        <WishTryOnGallery
          photos={historyPhotos}
          startIndex={2}
          deletingImageKey={deletingImageKey}
          deleteError={deleteError}
          onDelete={onDeletePhoto}
        />
      ) : null}
    </Stack>
  );
};
