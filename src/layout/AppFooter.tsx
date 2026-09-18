import { Box, Typography } from "@mui/material";
import { getPublicAppEnv } from "../config/env";

export const AppFooter = () => {
  const { appName } = getPublicAppEnv();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        px: 2,
        py: 3,
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="body2" color="text.secondary" align="center">
        © {currentYear} {appName}
      </Typography>
    </Box>
  );
};
