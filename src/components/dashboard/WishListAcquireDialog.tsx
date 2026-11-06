import type { ChangeEvent } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Wardrobe } from "../../api/resourceTypes";
import { dashboardCopy } from "../../content/dashboardCopy";

export type WishListAcquireDialogProps = {
  open: boolean;
  wardrobes: Wardrobe[];
  selectedWardrobeId: string;
  isBusy?: boolean;
  error?: string;
  onClose: () => void;
  onWardrobeChange: (wardrobeId: string) => void;
  onConfirm: () => void;
};

export const WishListAcquireDialog = ({
  open,
  wardrobes,
  selectedWardrobeId,
  isBusy = false,
  error,
  onClose,
  onWardrobeChange,
  onConfirm,
}: WishListAcquireDialogProps) => {
  const copy = dashboardCopy.wishList;
  const hasWardrobes = wardrobes.length > 0;
  const title = hasWardrobes
    ? copy.acquirePickerTitle
    : copy.acquireNoWardrobeTitle;
  const description = hasWardrobes
    ? copy.acquirePickerDescription
    : copy.acquireNoWardrobeDescription;

  const handleClose = () => {
    if (isBusy) {
      return;
    }

    onClose();
  };

  const handleWardrobeChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onWardrobeChange(event.target.value);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="wish-list-acquire-title"
      aria-describedby="wish-list-acquire-description"
    >
      <DialogTitle id="wish-list-acquire-title">{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography id="wish-list-acquire-description" variant="body2">
            {description}
          </Typography>
          {hasWardrobes ? (
            <TextField
              id="wish-acquire-wardrobe"
              name="wardrobeId"
              label={copy.acquirePickerLabel}
              value={selectedWardrobeId}
              onChange={handleWardrobeChange}
              select
              required
              slotProps={{
                htmlInput: { "aria-label": copy.acquirePickerLabel },
              }}
            >
              {wardrobes.map((wardrobe) => (
                <MenuItem key={wardrobe.wardrobeId} value={wardrobe.wardrobeId}>
                  {wardrobe.name}
                </MenuItem>
              ))}
            </TextField>
          ) : null}
          {error ? (
            <Typography variant="body2" color="error" role="alert">
              {error}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          type="button"
          color="secondary"
          onClick={handleClose}
          tabIndex={0}
          aria-label={copy.cancelLabel}
          disabled={isBusy}
        >
          {copy.cancelLabel}
        </Button>
        {hasWardrobes ? (
          <Button
            type="button"
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            tabIndex={0}
            aria-label={
              isBusy ? copy.acquireSubmittingLabel : copy.acquireConfirmAriaLabel
            }
            disabled={isBusy || selectedWardrobeId.trim().length === 0}
          >
            {isBusy ? copy.acquireSubmittingLabel : copy.acquireConfirmLabel}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};
