import { useEffect, useMemo, useState } from "react";
import { ThemeProvider, useMediaQuery } from "@mui/material";
import {
  subscribeCookiePreferences,
  type ConsentFlags,
} from "../../config/consent";
import { commitConsentChoice } from "../../config/tracking";
import { resolveTrackingIds } from "../../config/trackingEvents";
import { useConsent } from "../../hooks/useConsent";
import { createDashboardTheme } from "../../theme/createDashboardTheme";
import {
  readThemePreference,
  resolveThemeMode,
} from "../../theme/themePreference";
import { CookieConsentBanner } from "./CookieConsentBanner";
import { CookiePreferencesDialog } from "./CookiePreferencesDialog";

const DEFAULT_FLAGS: ConsentFlags = {
  analytics: false,
  marketing: false,
};

export const CookieConsentHost = () => {
  const choice = useConsent();
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const showBanner = choice === null;
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(() => {
    return createDashboardTheme(
      resolveThemeMode(readThemePreference(), prefersDark),
    );
  }, [prefersDark]);

  useEffect(() => {
    return subscribeCookiePreferences(() => {
      setPreferencesOpen(true);
    });
  }, []);

  const handleAcceptAll = () => {
    commitConsentChoice(
      { analytics: true, marketing: true },
      resolveTrackingIds(),
    );
    setPreferencesOpen(false);
  };

  const handleRejectAll = () => {
    commitConsentChoice(
      { analytics: false, marketing: false },
      resolveTrackingIds(),
    );
    setPreferencesOpen(false);
  };

  const handleSavePreferences = (flags: ConsentFlags) => {
    commitConsentChoice(flags, resolveTrackingIds());
    setPreferencesOpen(false);
  };

  const handleOpenPreferences = () => {
    setPreferencesOpen(true);
  };

  const handleClosePreferences = () => {
    setPreferencesOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      {showBanner && !preferencesOpen ? (
        <CookieConsentBanner
          onAcceptAll={handleAcceptAll}
          onRejectAll={handleRejectAll}
          onManagePreferences={handleOpenPreferences}
        />
      ) : null}
      <CookiePreferencesDialog
        key={preferencesOpen ? "open" : "closed"}
        open={preferencesOpen}
        initialFlags={choice ?? DEFAULT_FLAGS}
        onClose={handleClosePreferences}
        onSave={handleSavePreferences}
        onAcceptAll={handleAcceptAll}
        onRejectAll={handleRejectAll}
      />
    </ThemeProvider>
  );
};
