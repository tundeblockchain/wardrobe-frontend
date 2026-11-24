import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getAuthErrorMessage } from "../../auth/authErrors";
import { validateEmail } from "../../auth/passwordValidation";
import { supportCopy } from "../../admin/supportCopy";
import { useAdminAuth } from "../../admin/useAdminAuth";
import { BrandLogo } from "../brand/BrandLogo";
import { getPublicAppEnv } from "../../config/env";

export const AdminSignInScreen = () => {
  const { appName } = getPublicAppEnv();
  const { signInWithGoogle, signInWithEmail } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isGoogleBusy, setIsGoogleBusy] = useState(false);
  const [isEmailBusy, setIsEmailBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const headingId = "admin-sign-in-heading";
  const isBusy = isGoogleBusy || isEmailBusy;

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (emailError) {
      setEmailError("");
    }
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    if (passwordError) {
      setPasswordError("");
    }
  };

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

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) {
      return;
    }

    const nextEmailError = validateEmail(email);
    const nextPasswordError =
      password.length === 0 ? "Enter a password." : undefined;
    if (nextEmailError || nextPasswordError) {
      setEmailError(nextEmailError ?? "");
      setPasswordError(nextPasswordError ?? "");
      setErrorMessage("");
      return;
    }

    setIsEmailBusy(true);
    setEmailError("");
    setPasswordError("");
    setErrorMessage("");
    try {
      await signInWithEmail(email, password);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsEmailBusy(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        maxWidth: 480,
        mx: "auto",
        p: { xs: 3, md: 5 },
        border: 1,
        borderColor: "divider",
      }}
    >
      <Stack spacing={3}>
        <Stack spacing={1.5}>
          <BrandLogo alt={`${appName} logo`} height={96} />
          <Typography id={headingId} variant="h1" component="h1">
            {supportCopy.signInTitle}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {supportCopy.signInDescription}
          </Typography>
        </Stack>

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
          onClick={() => {
            void handleGoogleClick();
          }}
          tabIndex={0}
          aria-label={supportCopy.googleLabel}
          startIcon={
            isGoogleBusy ? (
              <CircularProgress size={16} color="inherit" aria-hidden="true" />
            ) : undefined
          }
        >
          {isGoogleBusy ? supportCopy.googleBusyLabel : supportCopy.googleLabel}
        </Button>

        <Divider>or</Divider>

        <Stack
          component="form"
          noValidate
          onSubmit={handleEmailSubmit}
          spacing={2}
          aria-label={supportCopy.emailFormLabel}
        >
          <TextField
            id="admin-auth-email"
            name="email"
            label={supportCopy.emailLabel}
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
          <TextField
            id="admin-auth-password"
            name="password"
            label={supportCopy.passwordLabel}
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
            fullWidth
            autoComplete="current-password"
            error={Boolean(passwordError)}
            helperText={passwordError}
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
            disabled={isBusy}
            tabIndex={0}
            aria-label={supportCopy.emailSubmitLabel}
            startIcon={
              isEmailBusy ? (
                <CircularProgress size={16} color="inherit" aria-hidden="true" />
              ) : undefined
            }
          >
            {isEmailBusy
              ? supportCopy.emailBusyLabel
              : supportCopy.emailSubmitLabel}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};
