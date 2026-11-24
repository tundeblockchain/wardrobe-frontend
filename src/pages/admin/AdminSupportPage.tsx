import { Stack, Typography } from "@mui/material";
import { supportCopy } from "../../admin/supportCopy";
import { SupportInbox } from "../../components/admin/support/SupportInbox";

export const AdminSupportPage = () => {
  const headingId = "admin-support-heading";

  return (
    <Stack spacing={3} component="article" aria-labelledby={headingId}>
      <Stack spacing={1}>
        <Typography id={headingId} variant="h1" component="h1">
          {supportCopy.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {supportCopy.description}
        </Typography>
      </Stack>
      <SupportInbox />
    </Stack>
  );
};
