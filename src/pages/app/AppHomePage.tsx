import { useState } from "react";
import {
  Alert,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { getAuthErrorMessage } from "../../auth/authErrors";
import { useAuth } from "../../auth/useAuth";
import { SectionSurface } from "../../components/surfaces/SectionSurface";
import { getPublicAppEnv } from "../../config/env";

export const AppHomePage = () => {
  const { appName } = getPublicAppEnv();
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const headingId = "app-home-heading";

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setErrorMessage("");
    try {
      await signOut();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
      setIsSigningOut(false);
    }
  };

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
            {user?.email ? (
              <Typography variant="body2" color="text.secondary">
                Signed in as {user.email}
              </Typography>
            ) : null}
            {errorMessage ? (
              <Alert severity="error" role="alert" aria-live="assertive">
                {errorMessage}
              </Alert>
            ) : null}
            <Button
              type="button"
              variant="outlined"
              color="primary"
              onClick={handleSignOut}
              disabled={isSigningOut}
              tabIndex={0}
              aria-label="Sign out"
              sx={{ alignSelf: "flex-start" }}
            >
              {isSigningOut ? "Signing out…" : "Sign out"}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </SectionSurface>
  );
};
