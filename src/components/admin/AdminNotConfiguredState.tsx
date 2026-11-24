import { Alert, Stack, Typography } from "@mui/material";
import { supportCopy } from "../../admin/supportCopy";

export const AdminNotConfiguredState = () => {
  return (
    <Stack spacing={2} sx={{ maxWidth: 560, mx: "auto", py: { xs: 6, md: 8 } }}>
      <Typography variant="h1" component="h1">
        {supportCopy.notConfiguredTitle}
      </Typography>
      <Alert severity="info" role="status" aria-live="polite">
        {supportCopy.notConfiguredDescription}
      </Alert>
    </Stack>
  );
};
