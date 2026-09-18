import { Box, Stack, Typography } from "@mui/material";
import { getPublicAppEnv } from "../config/env";
import { AppNavLinks } from "./AppNavLinks";
import { landingNavLinks, legalNavLinks } from "./landingNav";

export const AppFooter = () => {
  const { appName } = getPublicAppEnv();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        px: 2,
        py: 4,
        bgcolor: "background.default",
        color: "text.secondary",
        borderTop: 1,
        borderColor: "divider",
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
        <Typography variant="body2" align="center" color="text.secondary">
          © {currentYear} {appName}
        </Typography>
      </Stack>
    </Box>
  );
};
