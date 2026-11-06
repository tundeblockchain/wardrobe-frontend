import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import type { MissingAcquireDetails } from "../../api/wishlistApi";
import { dashboardCopy } from "../../content/dashboardCopy";

export type WishListAcquireReadyDialogProps = {
  open: boolean;
  missing: MissingAcquireDetails;
  onClose: () => void;
  onEdit: () => void;
};

const descriptionForMissing = (missing: MissingAcquireDetails): string => {
  const copy = dashboardCopy.wishList;
  if (missing.category && missing.image) {
    return copy.acquireNeedsBothDescription;
  }
  if (missing.category) {
    return copy.acquireNeedsCategoryDescription;
  }
  return copy.acquireNeedsPhotoDescription;
};

export const WishListAcquireReadyDialog = ({
  open,
  missing,
  onClose,
  onEdit,
}: WishListAcquireReadyDialogProps) => {
  const copy = dashboardCopy.wishList;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="wish-list-acquire-ready-title"
      aria-describedby="wish-list-acquire-ready-description"
    >
      <DialogTitle id="wish-list-acquire-ready-title">
        {copy.acquireNeedsDetailsTitle}
      </DialogTitle>
      <DialogContent>
        <Typography id="wish-list-acquire-ready-description" variant="body2">
          {descriptionForMissing(missing)}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          type="button"
          color="secondary"
          onClick={onClose}
          tabIndex={0}
          aria-label={copy.cancelLabel}
        >
          {copy.cancelLabel}
        </Button>
        <Button
          type="button"
          variant="contained"
          color="primary"
          onClick={onEdit}
          tabIndex={0}
          aria-label={copy.acquireNeedsDetailsAriaLabel}
        >
          {copy.acquireNeedsDetailsAction}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
