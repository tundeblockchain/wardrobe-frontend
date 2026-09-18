import { Box, Link, Stack, Typography } from "@mui/material";
import { getPublicAppEnv } from "../config/env";
import { landingNavLinks } from "./landingNav";

export const AppFooter = () => {
  const { appName } = getPublicAppEnv();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        px: 2,
        py: 4,
        bgcolor: "primary.dark",
        color: "primary.contrastText",
      }}
    >
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <Box
          component="nav"
          aria-label="Footer"
          sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}
        >
          {landingNavLinks.map((navLink) => (
            <Link
              key={navLink.href}
              href={navLink.href}
              color="inherit"
              underline="hover"
              tabIndex={0}
              aria-label={navLink.ariaLabel}
              sx={{ fontSize: "0.875rem" }}
            >
              {navLink.label}
            </Link>
          ))}
        </Box>
        <Typography variant="body2" align="center" sx={{ opacity: 0.85 }}>
          © {currentYear} {appName}
        </Typography>
      </Stack>
    </Box>
  );
};
