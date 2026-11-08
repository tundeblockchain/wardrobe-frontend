import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import type { WishTryOnPhoto } from "../../api/wishTryOn";
import { dashboardCopy } from "../../content/dashboardCopy";
import { ResourceImage } from "./ResourceImage";

export const WISH_TRY_ON_GALLERY_TEST_ID = "wish-try-on-gallery";

export type WishTryOnGalleryProps = {
  photos: WishTryOnPhoto[];
  startIndex?: number;
  deletingImageKey?: string;
  deleteError?: string;
  onDelete: (imageKey: string) => void;
};

export const WishTryOnGallery = ({
  photos,
  startIndex = 1,
  deletingImageKey,
  deleteError,
  onDelete,
}: WishTryOnGalleryProps) => {
  const copy = dashboardCopy.wishList;
  const [pendingKey, setPendingKey] = useState<string | undefined>();

  if (photos.length === 0) {
    return null;
  }

  const handleAskDelete = (imageKey: string) => {
    setPendingKey(imageKey);
  };

  const handleCloseDelete = () => {
    if (deletingImageKey) {
      return;
    }

    setPendingKey(undefined);
  };

  const handleConfirmDelete = () => {
    if (!pendingKey) {
      return;
    }

    onDelete(pendingKey);
    setPendingKey(undefined);
  };

  return (
    <Stack
      spacing={2}
      component="section"
      aria-label={copy.virtualTryOnGalleryLabel}
      data-testid={WISH_TRY_ON_GALLERY_TEST_ID}
    >
      <Typography variant="h3" component="h3">
        {copy.virtualTryOnGalleryLabel}
      </Typography>
      {deleteError ? (
        <Typography variant="body2" color="error" role="alert">
          {deleteError}
        </Typography>
      ) : null}
      <Box
        component="ul"
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
          },
          gap: 2,
          listStyle: "none",
          p: 0,
          m: 0,
        }}
      >
        {photos.map((photo, index) => {
          const deleteLabel = `${copy.virtualTryOnDeletePhotoAriaLabel} ${startIndex + index}`;
          return (
            <Box key={`${photo.imageKey ?? photo.imageUrl}-${index}`} component="li">
              <Stack spacing={1}>
                <Box
                  sx={{
                    aspectRatio: "3 / 4",
                    overflow: "hidden",
                    borderRadius: 2,
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <ResourceImage
                    imageUrl={photo.imageUrl}
                    alt={`Virtual Try On render ${index + 1}`}
                    fallbackLabel="Virtual Try On photo not available"
                  />
                </Box>
                {photo.imageKey ? (
                  <IconButton
                    type="button"
                    color="error"
                    onClick={() => {
                      handleAskDelete(photo.imageKey as string);
                    }}
                    tabIndex={0}
                    aria-label={deleteLabel}
                    disabled={Boolean(deletingImageKey)}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    <DeleteOutlined aria-hidden="true" />
                  </IconButton>
                ) : null}
              </Stack>
            </Box>
          );
        })}
      </Box>
      {pendingKey ? (
        <Dialog
          open
          onClose={handleCloseDelete}
          aria-labelledby="delete-try-on-photo-title"
          aria-describedby="delete-try-on-photo-description"
        >
          <DialogTitle id="delete-try-on-photo-title">
            {copy.virtualTryOnDeletePhotoConfirmTitle}
          </DialogTitle>
          <DialogContent>
            <Typography id="delete-try-on-photo-description" variant="body2">
              {copy.virtualTryOnDeletePhotoConfirmDescription}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={handleCloseDelete}
              color="secondary"
              tabIndex={0}
              aria-label={copy.cancelLabel}
              disabled={Boolean(deletingImageKey)}
            >
              {copy.cancelLabel}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              tabIndex={0}
              aria-label={copy.virtualTryOnDeletePhotoConfirmLabel}
              disabled={Boolean(deletingImageKey)}
            >
              {copy.virtualTryOnDeletePhotoConfirmLabel}
            </Button>
          </DialogActions>
        </Dialog>
      ) : null}
    </Stack>
  );
};
