import { useState } from "react";
import { Alert, Button, CircularProgress, Stack } from "@mui/material";
import { getAuthErrorMessage } from "./authErrors";
import { useAuth } from "./useAuth";

export const SocialAuthButtons = () => {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [isGoogleBusy, setIsGoogleBusy] = useState(false);
  const [isAppleBusy, setIsAppleBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isBusy = isGoogleBusy || isAppleBusy;

  const handleGoogleClick = async () => {
    if (isBusy) {
      return;
    }

    setIsGoogleBusy(true);
    setErrorMessage("");
    try {
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsGoogleBusy(false);
    }
  };

  const handleAppleClick = async () => {
    if (isBusy) {
      return;
    }

    setIsAppleBusy(true);
    setErrorMessage("");
    try {
      await signInWithApple();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsAppleBusy(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      {errorMessage ? (
        <Alert severity="error" role="alert" aria-live="assertive">
          {errorMessage}
        </Alert>
      ) : null}
      <Button
        type="button"
        variant="outlined"
        color="primary"
        fullWidth
        disabled={isBusy}
        onClick={handleGoogleClick}
        tabIndex={0}
        aria-label="Continue with Google"
        startIcon={
          isGoogleBusy ? (
            <CircularProgress size={16} color="inherit" aria-hidden="true" />
          ) : undefined
        }
      >
        {isGoogleBusy ? "Connecting…" : "Continue with Google"}
      </Button>
      <Button
        type="button"
        variant="outlined"
        color="primary"
        fullWidth
        disabled={isBusy}
        onClick={handleAppleClick}
        tabIndex={0}
        aria-label="Continue with Apple"
        startIcon={
          isAppleBusy ? (
            <CircularProgress size={16} color="inherit" aria-hidden="true" />
          ) : undefined
        }
      >
        {isAppleBusy ? "Connecting…" : "Continue with Apple"}
      </Button>
    </Stack>
  );
};
