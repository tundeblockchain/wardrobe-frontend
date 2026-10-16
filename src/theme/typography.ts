import type { TypographyVariantsOptions } from "@mui/material/styles";

const SYSTEM_SANS_FALLBACK =
  'system-ui, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';

export const headingFontFamily = `"Sora", ${SYSTEM_SANS_FALLBACK}`;
export const bodyFontFamily = `"Inter", ${SYSTEM_SANS_FALLBACK}`;

export const appTypography = {
  fontFamily: bodyFontFamily,
  h1: {
    fontFamily: headingFontFamily,
    fontSize: "2.5rem",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: 1.15,
  },
  h2: {
    fontFamily: headingFontFamily,
    fontSize: "2rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  h3: {
    fontFamily: headingFontFamily,
    fontSize: "1.25rem",
    fontWeight: 600,
  },
  h4: {
    fontFamily: headingFontFamily,
    fontWeight: 600,
  },
  h5: {
    fontFamily: headingFontFamily,
    fontWeight: 600,
  },
  h6: {
    fontFamily: headingFontFamily,
    fontWeight: 600,
  },
  subtitle1: {
    fontFamily: bodyFontFamily,
    fontWeight: 500,
  },
  subtitle2: {
    fontFamily: bodyFontFamily,
    fontWeight: 500,
  },
  body1: {
    fontFamily: bodyFontFamily,
    fontWeight: 400,
  },
  body2: {
    fontFamily: bodyFontFamily,
    fontWeight: 400,
  },
  button: {
    fontFamily: bodyFontFamily,
    fontWeight: 600,
  },
  caption: {
    fontFamily: bodyFontFamily,
    fontWeight: 400,
  },
  overline: {
    fontFamily: headingFontFamily,
    fontWeight: 600,
  },
} satisfies TypographyVariantsOptions;
