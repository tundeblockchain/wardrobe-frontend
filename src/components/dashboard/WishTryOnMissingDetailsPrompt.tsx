import { Alert, Button, Stack } from "@mui/material";
import type { MissingAcquireDetails } from "../../api/wishlistApi";
import { dashboardCopy } from "../../content/dashboardCopy";

export type WishTryOnMissingDetailsPromptProps = {
  missing: MissingAcquireDetails;
  onEdit: () => void;
};

const descriptionForMissing = (missing: MissingAcquireDetails): string => {
  const copy = dashboardCopy.wishList;
  if (missing.category && missing.image) {
    return copy.virtualTryOnNeedsBothDescription;
  }
  if (missing.category) {
    return copy.virtualTryOnNeedsCategoryDescription;
  }

  return copy.virtualTryOnNeedsPhotoDescription;
};

export const WishTryOnMissingDetailsPrompt = ({
  missing,
  onEdit,
}: WishTryOnMissingDetailsPromptProps) => {
  const copy = dashboardCopy.wishList;

  const handleEdit = () => {
    onEdit();
  };

  return (
    <Alert
      severity="info"
      role="status"
      aria-label={copy.virtualTryOnNeedsDetailsTitle}
    >
      <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
        {descriptionForMissing(missing)}
        <Button
          type="button"
          variant="contained"
          color="primary"
          onClick={handleEdit}
          tabIndex={0}
          aria-label={copy.virtualTryOnNeedsDetailsAriaLabel}
        >
          {copy.virtualTryOnNeedsDetailsAction}
        </Button>
      </Stack>
    </Alert>
  );
};
