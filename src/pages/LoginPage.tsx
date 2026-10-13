import { Container, Paper, Stack, Typography } from "@mui/material";
import { SectionSurface } from "../components/surfaces/SectionSurface";
import { getPublicAppEnv } from "../config/env";

export const LoginPage = () => {
  const { appName } = getPublicAppEnv();
  const headingId = "login-page-heading";

  return (
    <SectionSurface
      component="article"
      variant="mist"
      aria-labelledby={headingId}
      sx={{
        py: { xs: 6, md: 8 },
      }}
    >
      <Container maxWidth="sm">
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
              Sign in
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to open your closet on the web. Account sign-in will be
              connected in a later update.
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </SectionSurface>
  );
};
