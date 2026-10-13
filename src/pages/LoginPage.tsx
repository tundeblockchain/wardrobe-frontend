import { useState } from "react";
import {
  Alert,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { EmailAuthForm } from "../auth/EmailAuthForm";
import { ForgotPasswordForm } from "../auth/ForgotPasswordForm";
import { SocialAuthButtons } from "../auth/SocialAuthButtons";
import { useFirebaseAuthListener } from "../auth/firebaseSession";
import { useAuth } from "../auth/useAuth";
import { SectionSurface } from "../components/surfaces/SectionSurface";
import { getPublicAppEnv, hasFirebaseWebConfig } from "../config/env";
import { RouteFallback } from "../routes/RouteFallback";
import {
  LOGIN_MODE_QUERY_PARAM,
  LOGIN_NEXT_QUERY_PARAM,
  LOGIN_SIGNUP_MODE,
  getPostLoginRedirectPath,
  isLoginSignupMode,
} from "../routes/paths";

type LoginView = "signIn" | "register" | "forgotPassword";

type LoginLocationState = {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
};

const getFromPath = (state: unknown): string | undefined => {
  if (typeof state !== "object" || state === null || !("from" in state)) {
    return undefined;
  }

  const from = (state as LoginLocationState).from;
  if (!from?.pathname) {
    return undefined;
  }

  return `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`;
};

export const LoginPage = () => {
  useFirebaseAuthListener();
  const { appName } = getPublicAppEnv();
  const { user, loading } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const headingId = "login-page-heading";
  const isFirebaseConfigured = hasFirebaseWebConfig();
  const view: LoginView = showForgotPassword
    ? "forgotPassword"
    : isLoginSignupMode(searchParams.get(LOGIN_MODE_QUERY_PARAM))
      ? "register"
      : "signIn";

  if (loading) {
    return <RouteFallback label="Checking sign-in status" />;
  }

  if (user) {
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = getPostLoginRedirectPath(
      searchParams.get(LOGIN_NEXT_QUERY_PARAM),
      getFromPath(location.state),
    );
    return <Navigate to={redirectPath} replace />;
  }

  const heading =
    view === "register"
      ? "Create account"
      : view === "forgotPassword"
        ? "Forgot password"
        : "Sign in";

  const handleShowSignIn = () => {
    setShowForgotPassword(false);
    if (!searchParams.has(LOGIN_MODE_QUERY_PARAM)) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete(LOGIN_MODE_QUERY_PARAM);
    setSearchParams(nextParams, { replace: true });
  };

  const handleShowRegister = () => {
    setShowForgotPassword(false);
    if (isLoginSignupMode(searchParams.get(LOGIN_MODE_QUERY_PARAM))) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(LOGIN_MODE_QUERY_PARAM, LOGIN_SIGNUP_MODE);
    setSearchParams(nextParams, { replace: true });
  };

  const handleShowForgotPassword = () => {
    setShowForgotPassword(true);
  };

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
          <Stack spacing={3}>
            <Stack spacing={1.5}>
              <Typography
                variant="overline"
                component="p"
                sx={{ color: "secondary.dark", letterSpacing: "0.16em" }}
              >
                {appName}
              </Typography>
              <Typography id={headingId} variant="h1" component="h1">
                {heading}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {view === "forgotPassword"
                  ? "Enter the email you use for Pocket Closet and we will send a reset link."
                  : view === "register"
                    ? "Create an account with the same email you use in the mobile app, or continue with Google or Apple."
                    : "Sign in with the same account you use in the Pocket Closet app."}
              </Typography>
            </Stack>

            {!isFirebaseConfigured ? (
              <Alert severity="info" role="status" aria-live="polite">
                Sign-in is not configured yet. Set the public VITE_FIREBASE_*
                environment variables to enable Google, Apple, and email
                sign-in.
              </Alert>
            ) : null}

            {view === "forgotPassword" ? (
              <ForgotPasswordForm onBackToSignIn={handleShowSignIn} />
            ) : (
              <Stack spacing={3}>
                <SocialAuthButtons />
                <Divider>or</Divider>
                <EmailAuthForm mode={view === "register" ? "register" : "signIn"} />
                <Stack spacing={0.5} sx={{ alignItems: "flex-start" }}>
                  {view === "signIn" ? (
                    <>
                      <Button
                        type="button"
                        variant="text"
                        color="primary"
                        onClick={handleShowRegister}
                        tabIndex={0}
                        aria-label="Create account"
                      >
                        Create account
                      </Button>
                      <Button
                        type="button"
                        variant="text"
                        color="primary"
                        onClick={handleShowForgotPassword}
                        tabIndex={0}
                        aria-label="Forgot password"
                      >
                        Forgot password?
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="text"
                      color="primary"
                      onClick={handleShowSignIn}
                      tabIndex={0}
                      aria-label="Back to sign in"
                    >
                      Already have an account? Sign in
                    </Button>
                  )}
                </Stack>
              </Stack>
            )}
          </Stack>
        </Paper>
      </Container>
    </SectionSurface>
  );
};
