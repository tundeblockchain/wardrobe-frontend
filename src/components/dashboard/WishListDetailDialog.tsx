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
import {
  formatWishPrice,
  getSafeWishLinkUrl,
  getWishImageUrl,
  type WishItem,
} from "../../api/wishlistApi";
import { dashboardCopy } from "../../content/dashboardCopy";
import { ResourceImage } from "./ResourceImage";

export type WishListDetailDialogProps = {
  wish: WishItem;
  isBusy?: boolean;
  onClose: () => void;
  onEdit: (wish: WishItem) => void;
  onDelete: (wish: WishItem) => void;
  onAcquire: (wish: WishItem) => void;
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
  isBusy = false,
  onClose,
  onEdit,
  onDelete,
  onAcquire,
}: WishListDetailDialogProps) => {
  const copy = dashboardCopy.wishList;
  const titleId = `wish-detail-${wish.wishId}-title`;
  const safeLink = getSafeWishLinkUrl(wish.linkUrl);
  const priceLabel = formatWishPrice(wish.price, wish.currency);
  const categoryLabel = wish.category
    ? getClothingCategoryLabel(wish.category)
    : undefined;

  const handleClose = () => {
    if (isBusy) {
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
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1, px: 3, pb: 2 }}>
        <Button
          type="button"
          color="secondary"
          onClick={handleClose}
          tabIndex={0}
          aria-label={copy.closeLabel}
          disabled={isBusy}
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
          disabled={isBusy}
        >
          {copy.editLabel}
        </Button>
        <Button
          type="button"
          color="error"
          onClick={handleDelete}
          tabIndex={0}
          aria-label={copy.deleteAriaLabel}
          disabled={isBusy}
        >
          {copy.deleteLabel}
        </Button>
        <Button
          type="button"
          variant="contained"
          color="primary"
          onClick={handleAcquire}
          tabIndex={0}
          aria-label={
            isBusy ? copy.acquireSubmittingLabel : copy.acquireAriaLabel
          }
          disabled={isBusy}
        >
          {isBusy ? copy.acquireSubmittingLabel : copy.acquireLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
