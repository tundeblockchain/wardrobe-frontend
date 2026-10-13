import { useState, type ChangeEvent, type FormEvent } from "react";
import { Alert, Button, CircularProgress, Stack, TextField } from "@mui/material";
import { getAuthErrorMessage } from "./authErrors";
import { validateEmail } from "./passwordValidation";
import { useAuth } from "./useAuth";

export type ForgotPasswordFormProps = {
  onBackToSignIn: () => void;
};

export const ForgotPasswordForm = ({
  onBackToSignIn,
}: ForgotPasswordFormProps) => {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (emailError) {
      setEmailError(undefined);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const nextEmailError = validateEmail(email);
    if (nextEmailError) {
      setEmailError(nextEmailError);
      setSuccessMessage("");
      setErrorMessage("");
      return;
    }

    setIsSubmitting(true);
    setEmailError(undefined);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await sendPasswordReset(email);
      setSuccessMessage("Check your email for a password reset link.");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackClick = () => {
    onBackToSignIn();
  };

  return (
    <Stack
      component="form"
      noValidate
      onSubmit={handleSubmit}
      spacing={2.5}
      aria-label="Forgot password form"
    >
      {errorMessage ? (
        <Alert severity="error" role="alert" aria-live="assertive">
          {errorMessage}
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert severity="success" role="status" aria-live="polite">
          {successMessage}
        </Alert>
      ) : null}
      <TextField
        id="forgot-password-email"
        name="email"
        label="Email"
        type="email"
        value={email}
        onChange={handleEmailChange}
        required
        fullWidth
        autoComplete="email"
        error={Boolean(emailError)}
        helperText={emailError}
        slotProps={{
          htmlInput: {
            "aria-required": true,
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={isSubmitting}
        tabIndex={0}
        aria-label="Send password reset link"
        startIcon={
          isSubmitting ? (
            <CircularProgress size={16} color="inherit" aria-hidden="true" />
          ) : undefined
        }
      >
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
      <Button
        type="button"
        variant="text"
        color="primary"
        onClick={handleBackClick}
        tabIndex={0}
        aria-label="Back to sign in"
      >
        Back to sign in
      </Button>
    </Stack>
  );
};
