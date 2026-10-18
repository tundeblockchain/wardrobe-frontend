import { Box, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { BrandLogo } from "../components/brand/BrandLogo";
import { SectionSurface } from "../components/surfaces/SectionSurface";
import { getPublicAppEnv } from "../config/env";
import { appPaths } from "../routes/paths";
import { AppNavLinks } from "./AppNavLinks";
import { landingNavLinks, legalNavLinks } from "./landingNav";

export const AppFooter = () => {
  const { appName } = getPublicAppEnv();
  const currentYear = new Date().getFullYear();

  return (
    <SectionSurface
      component="footer"
      variant="mist"
      sx={{
        px: 2,
        py: 4,
        bgcolor: "primary.dark",
        color: (theme) =>
          theme.palette.mode === "dark"
            ? theme.palette.text.primary
            : theme.palette.primary.contrastText,
      }}
    >
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <Box
          component={RouterLink}
          to={appPaths.home}
          tabIndex={0}
          aria-label={`${appName} home`}
          sx={{
            display: "flex",
            alignItems: "center",
            color: "inherit",
            textDecoration: "none",
          }}
        >
          <BrandLogo height={56} />
        </Box>
        <AppNavLinks
          ariaLabel="Footer"
          links={landingNavLinks}
          justifyContent="center"
        />
        <AppNavLinks
          ariaLabel="Legal"
          links={legalNavLinks}
          justifyContent="center"
        />
        <Typography variant="body2" align="center" sx={{ opacity: 0.85 }}>
          © {currentYear} {appName}
        </Typography>
      </Stack>
    </SectionSurface>
  );
};
