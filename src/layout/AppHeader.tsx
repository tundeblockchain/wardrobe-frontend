import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { getPublicAppEnv } from "../config/env";
import { AppNavLinks } from "./AppNavLinks";
import { primaryNavLinks } from "./landingNav";
import { appPaths } from "../routes/paths";

export const AppHeader = () => {
  const { appName } = getPublicAppEnv();

  return (
    <AppBar position="sticky" color="primary" component="header">
      <Toolbar
        sx={{
          gap: 2,
          flexWrap: "wrap",
          py: { xs: 1, sm: 0 },
        }}
      >
        <Box
          component={RouterLink}
          to={appPaths.home}
          tabIndex={0}
          aria-label={`${appName} home`}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            color: "inherit",
            textDecoration: "none",
            mr: "auto",
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt=""
            sx={{
              height: { xs: 40, sm: 48 },
              width: "auto",
              display: "block",
              borderRadius: 1,
            }}
          />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            {appName}
          </Typography>
        </Box>
        <AppNavLinks
          ariaLabel="Primary"
          links={primaryNavLinks}
          fontSize={{ xs: "0.875rem", sm: "1rem" }}
        />
      </Toolbar>
    </AppBar>
  );
};
