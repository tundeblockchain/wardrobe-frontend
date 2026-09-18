import { Container, Stack, Typography } from "@mui/material";
import { StatusCard } from "../components/StatusCard";
import { getPublicAppEnv } from "../config/env";

export const HomePage = () => {
  const { appName } = getPublicAppEnv();

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={3}>
        <Typography variant="h1" component="h1">
          {appName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The public site scaffold is in place. Marketing content, legal pages,
          and analytics land in follow-on work.
        </Typography>
        <StatusCard
          title="Ready for the next tickets"
          description="Reusable layout, lint, tests, CI, and Netlify config are available. Store URLs and analytics IDs are env placeholders only."
        />
      </Stack>
    </Container>
  );
};
