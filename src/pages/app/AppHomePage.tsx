import { Container, Paper, Stack, Typography } from "@mui/material";
import { SectionSurface } from "../../components/surfaces/SectionSurface";
import { getPublicAppEnv } from "../../config/env";

export const AppHomePage = () => {
  const { appName } = getPublicAppEnv();
  const headingId = "app-home-heading";

  return (
    <SectionSurface
      component="article"
      variant="mist"
      aria-labelledby={headingId}
      sx={{
        py: { xs: 6, md: 8 },
        flex: 1,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Stack spacing={2}>
            <Typography
              variant="overline"
              component="p"
              sx={{ color: "secondary.dark", letterSpacing: "0.16em" }}
            >
              {appName}
            </Typography>
            <Typography id={headingId} variant="h1" component="h1">
              Your closet
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This is the signed-in app home. Closet tools will appear here in a
              later update.
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </SectionSurface>
  );
};
