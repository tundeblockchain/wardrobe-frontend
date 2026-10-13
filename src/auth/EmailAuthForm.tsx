import { useState, type ChangeEvent, type FormEvent } from "react";
import { Alert, Button, CircularProgress, Stack, TextField } from "@mui/material";
import { getAuthErrorMessage } from "./authErrors";
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from "./passwordValidation";
import { useAuth } from "./useAuth";

export type EmailAuthMode = "signIn" | "register";

export type EmailAuthFormProps = {
  mode: EmailAuthMode;
};

type EmailAuthField = "email" | "password" | "confirmPassword";

type EmailAuthFieldErrors = Partial<Record<EmailAuthField, string>>;

export const EmailAuthForm = ({ mode }: EmailAuthFormProps) => {
  const { signInWithEmail, registerWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<EmailAuthFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isRegister = mode === "register";
  const submitLabel = isRegister ? "Create account" : "Sign in with email";

  const handleFieldChange =
    (field: EmailAuthField) => (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      if (field === "email") {
        setEmail(nextValue);
      } else if (field === "password") {
        setPassword(nextValue);
      } else {
        setConfirmPassword(nextValue);
      }

      setFieldErrors((currentErrors) => {
        if (!currentErrors[field]) {
          return currentErrors;
        }

        const nextErrors = { ...currentErrors };
        delete nextErrors[field];
        return nextErrors;
      });
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const nextFieldErrors: EmailAuthFieldErrors = {};
    const emailError = validateEmail(email);
    if (emailError) {
      nextFieldErrors.email = emailError;
    }

    const passwordError = isRegister
      ? validatePassword(password)
      : password.length === 0
        ? "Enter a password."
        : undefined;
    if (passwordError) {
      nextFieldErrors.password = passwordError;
    }

    if (isRegister) {
      const confirmationError = validatePasswordConfirmation(
        password,
        confirmPassword,
      );
      if (confirmationError) {
        nextFieldErrors.confirmPassword = confirmationError;
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setErrorMessage("");
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setErrorMessage("");

    try {
      if (isRegister) {
        await registerWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack
      component="form"
      noValidate
      onSubmit={handleSubmit}
      spacing={2}
      aria-label={isRegister ? "Create account form" : "Email sign-in form"}
    >
      {errorMessage ? (
        <Alert severity="error" role="alert" aria-live="assertive">
          {errorMessage}
        </Alert>
      ) : null}
      <TextField
        id={`auth-email-${mode}`}
        name="email"
        label="Email"
        type="email"
        value={email}
        onChange={handleFieldChange("email")}
        required
        fullWidth
        autoComplete="email"
        error={Boolean(fieldErrors.email)}
        helperText={fieldErrors.email}
        slotProps={{
          htmlInput: {
            "aria-required": true,
          },
        }}
      />
      <TextField
        id={`auth-password-${mode}`}
        name="password"
        label="Password"
        type="password"
        value={password}
        onChange={handleFieldChange("password")}
        required
        fullWidth
        autoComplete={isRegister ? "new-password" : "current-password"}
        error={Boolean(fieldErrors.password)}
        helperText={fieldErrors.password}
        slotProps={{
          htmlInput: {
            "aria-required": true,
          },
        }}
      />
      {isRegister ? (
        <TextField
          id="auth-confirm-password"
          name="confirmPassword"
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={handleFieldChange("confirmPassword")}
          required
          fullWidth
          autoComplete="new-password"
          error={Boolean(fieldErrors.confirmPassword)}
          helperText={fieldErrors.confirmPassword}
          slotProps={{
            htmlInput: {
              "aria-required": true,
            },
          }}
        />
      ) : null}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={isSubmitting}
        tabIndex={0}
        aria-label={submitLabel}
        startIcon={
          isSubmitting ? (
            <CircularProgress size={16} color="inherit" aria-hidden="true" />
          ) : undefined
        }
      >
        {isSubmitting ? "Please wait…" : submitLabel}
      </Button>
    </Stack>
  );
};
