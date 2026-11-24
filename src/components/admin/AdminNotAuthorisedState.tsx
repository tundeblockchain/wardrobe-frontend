import { Alert, Button, Stack, Typography } from "@mui/material";
import { supportCopy } from "../../admin/supportCopy";
import { useAdminAuth } from "../../admin/useAdminAuth";

export const AdminNotAuthorisedState = () => {
  const { signOut, user } = useAdminAuth();

  const handleSignOut = () => {
    void signOut();
  };

  return (
    <Stack spacing={2} sx={{ maxWidth: 560, mx: "auto", py: { xs: 6, md: 8 } }}>
      <Typography variant="h1" component="h1">
        {supportCopy.notAuthorisedTitle}
      </Typography>
      <Alert severity="warning" role="status" aria-live="polite">
        {supportCopy.notAuthorisedDescription}
      </Alert>
      {user?.email ? (
        <Typography variant="body2" color="text.secondary">
          {user.email}
        </Typography>
      ) : null}
      <Button
        type="button"
        variant="outlined"
        color="primary"
        onClick={handleSignOut}
        tabIndex={0}
        aria-label={supportCopy.signOutLabel}
      >
        {supportCopy.signOutLabel}
      </Button>
    </Stack>
  );
};
