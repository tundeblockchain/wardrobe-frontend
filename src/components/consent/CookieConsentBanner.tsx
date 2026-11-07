import { useEffect, useRef, type KeyboardEvent } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { consentCopy } from "../../content/consentCopy";

export const COOKIE_CONSENT_BANNER_ID = "cookie-consent-banner";

export type CookieConsentBannerProps = {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onManagePreferences: () => void;
};

export const CookieConsentBanner = ({
  onAcceptAll,
  onRejectAll,
  onManagePreferences,
}: CookieConsentBannerProps) => {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bannerRef.current?.focus();
    const root = document.documentElement;
    const previousPadding = root.style.scrollPaddingBottom;
    root.style.scrollPaddingBottom = "12rem";
    return () => {
      root.style.scrollPaddingBottom = previousPadding;
    };
  }, []);

  const handleAcceptAll = () => {
    onAcceptAll();
  };

  const handleRejectAll = () => {
    onRejectAll();
  };

  const handleManagePreferences = () => {
    onManagePreferences();
  };

  const handleAcceptKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onAcceptAll();
  };

  const handleRejectKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onRejectAll();
  };

  const handleManageKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onManagePreferences();
  };

  return (
    <Box
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.snackbar,
        p: { xs: 1.5, sm: 2 },
        pointerEvents: "none",
      }}
    >
      <Paper
        ref={bannerRef}
        id={COOKIE_CONSENT_BANNER_ID}
        component="section"
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
        tabIndex={-1}
        elevation={8}
        sx={{
          pointerEvents: "auto",
          maxWidth: 960,
          mx: "auto",
          p: { xs: 2, sm: 2.5 },
          borderRadius: { xs: "16px 16px 12px 12px", sm: 2 },
          bgcolor: "background.paper",
          color: "text.primary",
          outline: "none",
          "&:focus-visible": {
            boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}`,
          },
        }}
      >
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography id="cookie-consent-title" variant="h2" component="h2">
              {consentCopy.bannerTitle}
            </Typography>
            <Typography
              id="cookie-consent-description"
              variant="body2"
              color="text.secondary"
            >
              {consentCopy.bannerDescription}
            </Typography>
          </Stack>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              justifyContent: { sm: "flex-end" },
              alignItems: { xs: "stretch", sm: "center" },
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
              sx={{ flex: { sm: "0 0 auto" } }}
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
              sx={{ flex: { sm: "0 0 auto" } }}
            >
              {consentCopy.acceptAll}
            </Button>
            <Button
              type="button"
              variant="text"
              color="primary"
              size="medium"
              onClick={handleManagePreferences}
              onKeyDown={handleManageKeyDown}
              tabIndex={0}
              aria-label={consentCopy.managePreferencesAriaLabel}
            >
              {consentCopy.managePreferences}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
