import type { KeyboardEvent } from "react";
import { Button, Link } from "@mui/material";
import { openCookiePreferences } from "../../config/consent";
import { consentCopy } from "../../content/consentCopy";

export type CookieSettingsControlProps = {
  variant?: "link" | "button";
};

export const CookieSettingsControl = ({
  variant = "link",
}: CookieSettingsControlProps) => {
  const handleClick = () => {
    openCookiePreferences();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement | HTMLAnchorElement>,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openCookiePreferences();
  };

  if (variant === "button") {
    return (
      <Button
        type="button"
        variant="outlined"
        color="secondary"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label={consentCopy.cookieSettingsAriaLabel}
      >
        {consentCopy.cookieSettings}
      </Button>
    );
  }

  return (
    <Link
      component="button"
      type="button"
      color="inherit"
      underline="hover"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={consentCopy.cookieSettingsAriaLabel}
      sx={{
        fontWeight: 500,
        fontSize: "0.875rem",
        cursor: "pointer",
        border: 0,
        background: "none",
        font: "inherit",
      }}
    >
      {consentCopy.cookieSettings}
    </Link>
  );
};
