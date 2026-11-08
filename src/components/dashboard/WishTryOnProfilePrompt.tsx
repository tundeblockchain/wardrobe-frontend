import { Alert, Button, Stack } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { dashboardCopy } from "../../content/dashboardCopy";
import { appPaths } from "../../routes/paths";

export const WishTryOnProfilePrompt = () => {
  const copy = dashboardCopy.wishList;

  return (
    <Alert
      severity="info"
      role="status"
      aria-label={copy.virtualTryOnNeedsProfileTitle}
    >
      <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
        {copy.virtualTryOnNeedsProfileDescription}
        <Button
          component={RouterLink}
          to={appPaths.appVirtualProfileNew}
          variant="contained"
          color="primary"
          tabIndex={0}
          aria-label={copy.virtualTryOnNeedsProfileAriaLabel}
        >
          {copy.virtualTryOnNeedsProfileAction}
        </Button>
      </Stack>
    </Alert>
  );
};
