import { Stack, Typography } from "@mui/material";
import { SectionSurface } from "../components/surfaces/SectionSurface";
import { getPublicAppEnv } from "../config/env";
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
        color: "primary.contrastText",
      }}
    >
      <Stack spacing={2} sx={{ alignItems: "center" }}>
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
