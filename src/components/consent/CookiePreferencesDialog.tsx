import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { ConsentFlags } from "../../config/consent";
import { consentCopy } from "../../content/consentCopy";

export type CookiePreferencesDialogProps = {
  open: boolean;
  initialFlags: ConsentFlags;
  onClose: () => void;
  onSave: (flags: ConsentFlags) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
};

export const CookiePreferencesDialog = ({
  open,
  initialFlags,
  onClose,
  onSave,
  onAcceptAll,
  onRejectAll,
}: CookiePreferencesDialogProps) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [analytics, setAnalytics] = useState(initialFlags.analytics);
  const [marketing, setMarketing] = useState(initialFlags.marketing);

  const handleClose = () => {
    onClose();
  };

  const handleAnalyticsChange = (
    _event: ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    setAnalytics(checked);
  };

  const handleMarketingChange = (
    _event: ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    setMarketing(checked);
  };

  const handleSave = () => {
    onSave({ analytics, marketing });
  };

  const handleAcceptAll = () => {
    onAcceptAll();
  };

  const handleRejectAll = () => {
    onRejectAll();
  };

  const handleSaveKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleSave();
  };

  const handleAcceptKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleAcceptAll();
  };

  const handleRejectKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleRejectAll();
  };

  const handleEntered = () => {
    setAnalytics(initialFlags.analytics);
    setMarketing(initialFlags.marketing);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      transitionDuration={0}
      sx={{ zIndex: (currentTheme) => currentTheme.zIndex.snackbar + 1 }}
      aria-labelledby="cookie-preferences-title"
      aria-describedby="cookie-preferences-description"
      slotProps={{
        transition: { onEntered: handleEntered },
        backdrop: {
          sx: { bgcolor: "rgba(15, 10, 12, 0.55)" },
        },
        paper: {
          sx: {
            bgcolor: "background.paper",
            backgroundImage: "none",
            color: "text.primary",
            ...(isSmallScreen
              ? {
                  position: "fixed",
                  m: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  width: "100%",
                  maxWidth: "100%",
                  maxHeight: "90vh",
                  borderRadius: "16px 16px 0 0",
                }
              : {}),
          },
        },
      }}
    >
      <DialogTitle id="cookie-preferences-title">
        {consentCopy.preferencesTitle}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography id="cookie-preferences-description" variant="body2">
            {consentCopy.preferencesDescription}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked
                disabled
                color="primary"
                slotProps={{
                  input: { "aria-label": consentCopy.essentialAriaLabel },
                }}
              />
            }
            label={
              <Stack spacing={0.5}>
                <Typography variant="subtitle1">
                  {consentCopy.essentialLabel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {consentCopy.essentialDescription}
                </Typography>
              </Stack>
            }
            sx={{ alignItems: "flex-start", ml: 0, mr: 0 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={analytics}
                onChange={handleAnalyticsChange}
                color="primary"
                slotProps={{
                  input: { "aria-label": consentCopy.analyticsAriaLabel },
                }}
              />
            }
            label={
              <Stack spacing={0.5}>
                <Typography variant="subtitle1">
                  {consentCopy.analyticsLabel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {consentCopy.analyticsDescription}
                </Typography>
              </Stack>
            }
            sx={{ alignItems: "flex-start", ml: 0, mr: 0 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={marketing}
                onChange={handleMarketingChange}
                color="primary"
                slotProps={{
                  input: { "aria-label": consentCopy.marketingAriaLabel },
                }}
              />
            }
            label={
              <Stack spacing={0.5}>
                <Typography variant="subtitle1">
                  {consentCopy.marketingLabel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {consentCopy.marketingDescription}
                </Typography>
              </Stack>
            }
            sx={{ alignItems: "flex-start", ml: 0, mr: 0 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          flexWrap: "wrap",
          gap: 1,
          px: 3,
          pb: 2,
          justifyContent: { xs: "stretch", sm: "flex-end" },
        }}
      >
        <Button
          type="button"
          variant="contained"
          color="primary"
          size="medium"
          onClick={handleRejectAll}
          onKeyDown={handleRejectKeyDown}
          tabIndex={0}
          aria-label={consentCopy.rejectAllAriaLabel}
        >
          {consentCopy.rejectAll}
        </Button>
        <Button
          type="button"
          variant="contained"
          color="primary"
          size="medium"
          onClick={handleAcceptAll}
          onKeyDown={handleAcceptKeyDown}
          tabIndex={0}
          aria-label={consentCopy.acceptAllAriaLabel}
        >
          {consentCopy.acceptAll}
        </Button>
        <Button
          type="button"
          variant="outlined"
          color="primary"
          size="medium"
          onClick={handleSave}
          onKeyDown={handleSaveKeyDown}
          tabIndex={0}
          aria-label={consentCopy.savePreferencesAriaLabel}
        >
          {consentCopy.savePreferences}
        </Button>
        <Button
          type="button"
          variant="text"
          color="primary"
          onClick={handleClose}
          tabIndex={0}
          aria-label={consentCopy.cancelAriaLabel}
        >
          {consentCopy.cancel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
