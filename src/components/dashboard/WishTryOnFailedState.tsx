import { Alert, Button, Stack } from "@mui/material";
import { dashboardCopy } from "../../content/dashboardCopy";

export type WishTryOnFailedStateProps = {
  message?: string;
  onRetry: () => void;
  isBusy?: boolean;
};

export const WishTryOnFailedState = ({
  message,
  onRetry,
  isBusy = false,
}: WishTryOnFailedStateProps) => {
  const copy = dashboardCopy.wishList;

  const handleRetry = () => {
    if (isBusy) {
      return;
    }

    onRetry();
  };

  return (
    <Alert
      severity="error"
      role="alert"
      aria-label={copy.virtualTryOnFailedTitle}
    >
      <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
        {`${copy.virtualTryOnFailedTitle}. ${message?.trim() || copy.virtualTryOnFailedDescription}`}
        <Button
          type="button"
          variant="contained"
          color="primary"
          onClick={handleRetry}
          tabIndex={0}
          aria-label={copy.virtualTryOnRetryAriaLabel}
          disabled={isBusy}
        >
          {copy.virtualTryOnRetryLabel}
        </Button>
      </Stack>
    </Alert>
  );
};
