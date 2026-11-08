import CheckroomOutlined from "@mui/icons-material/CheckroomOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { getClothingCategoryLabel } from "../../api/resourceDisplay";
import type { ResourceApi } from "../../api/resourceApi";
import {
  formatWishPrice,
  getSafeWishLinkUrl,
  getWishImageUrl,
  type WishItem,
  type WishlistApi,
} from "../../api/wishlistApi";
import { dashboardCopy } from "../../content/dashboardCopy";
import { useWishTryOn } from "../../hooks/useWishTryOn";
import { VIRTUAL_TRY_ON_POLL_INTERVAL_MS } from "../../pages/app/virtualTryOnPoll";
import { ResourceImage } from "./ResourceImage";
import { WishTryOnAction } from "./WishTryOnAction";
import { WishTryOnPanel } from "./WishTryOnPanel";

export type WishListDetailDialogProps = {
  wish: WishItem;
  wishlistApi: WishlistApi;
  resourceApi: ResourceApi;
  isBusy?: boolean;
  pollIntervalMs?: number;
  onClose: () => void;
  onEdit: (wish: WishItem) => void;
  onDelete: (wish: WishItem) => void;
  onAcquire: (wish: WishItem) => void;
  onWishUpdated?: (wish: WishItem) => void;
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => {
  if (!value) {
    return null;
  }

  return (
    <Stack spacing={0.5}>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
};

export const WishListDetailDialog = ({
  wish,
  wishlistApi,
  resourceApi,
  isBusy = false,
  pollIntervalMs = VIRTUAL_TRY_ON_POLL_INTERVAL_MS,
  onClose,
  onEdit,
  onDelete,
  onAcquire,
  onWishUpdated,
}: WishListDetailDialogProps) => {
  const copy = dashboardCopy.wishList;
  const titleId = `wish-detail-${wish.wishId}-title`;
  const safeLink = getSafeWishLinkUrl(wish.link);
  const priceLabel = formatWishPrice(wish.price);
  const categoryLabel = wish.category
    ? getClothingCategoryLabel(wish.category)
    : undefined;
  const tryOn = useWishTryOn({
    wish,
    wishlistApi,
    resourceApi,
    pollIntervalMs,
    onWishUpdated,
  });
  const dialogBusy = isBusy || tryOn.isBusy;

  const handleClose = () => {
    if (dialogBusy) {
      return;
    }

    onClose();
  };

  const handleEdit = () => {
    onEdit(wish);
  };

  const handleDelete = () => {
    onDelete(wish);
  };

  const handleAcquire = () => {
    onAcquire(wish);
  };

  const handleTryOn = () => {
    void tryOn.handleTryOn();
  };

  const handleRetry = () => {
    tryOn.handleRetry();
  };

  const handleDeletePhoto = (imageKey: string) => {
    void tryOn.handleDeletePhoto(imageKey);
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
    >
      <DialogTitle id={titleId}>{wish.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Box
            sx={{
              height: 240,
              border: 1,
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <ResourceImage
              imageUrl={getWishImageUrl(wish)}
              alt={wish.name}
              fallbackLabel={copy.photoFallback}
              FallbackIcon={CheckroomOutlined}
            />
          </Box>
          <DetailRow label={copy.priceLabel} value={priceLabel} />
          <DetailRow label={copy.categoryLabel} value={categoryLabel} />
          <DetailRow label={copy.subcategoryLabel} value={wish.subcategory} />
          <DetailRow label={copy.notesLabel} value={wish.notes} />
          <WishTryOnPanel
            wish={wish}
            prompt={tryOn.prompt}
            isSubmitting={tryOn.isSubmitting}
            failedMessage={tryOn.failedMessage}
            entitlement={tryOn.entitlement}
            deletingImageKey={tryOn.deletingImageKey}
            deleteError={tryOn.deleteError}
            onEdit={handleEdit}
            onRetry={handleRetry}
            onDeletePhoto={handleDeletePhoto}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1, px: 3, pb: 2 }}>
        <Button
          type="button"
          color="secondary"
          onClick={handleClose}
          tabIndex={0}
          aria-label={copy.closeLabel}
          disabled={dialogBusy}
        >
          {copy.closeLabel}
        </Button>
        {safeLink ? (
          <Button
            component="a"
            href={safeLink}
            target="_blank"
            rel="noopener noreferrer"
            color="secondary"
            tabIndex={0}
            aria-label={copy.openLinkAriaLabel}
          >
            {copy.openLinkLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          color="secondary"
          onClick={handleEdit}
          tabIndex={0}
          aria-label={copy.editAriaLabel}
          disabled={dialogBusy}
        >
          {copy.editLabel}
        </Button>
        <Button
          type="button"
          color="error"
          onClick={handleDelete}
          tabIndex={0}
          aria-label={copy.deleteAriaLabel}
          disabled={dialogBusy}
        >
          {copy.deleteLabel}
        </Button>
        <WishTryOnAction isBusy={dialogBusy} onClick={handleTryOn} />
        <Button
          type="button"
          variant="contained"
          color="primary"
          onClick={handleAcquire}
          tabIndex={0}
          aria-label={
            isBusy ? copy.acquireSubmittingLabel : copy.acquireAriaLabel
          }
          disabled={dialogBusy}
        >
          {isBusy ? copy.acquireSubmittingLabel : copy.acquireLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
