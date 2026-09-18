import { AppBar, Toolbar, Typography } from "@mui/material";
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
        <Typography
          variant="h6"
          component={RouterLink}
          to={appPaths.home}
          tabIndex={0}
          aria-label={`${appName} home`}
          sx={{
            color: "inherit",
            textDecoration: "none",
            fontWeight: 600,
            mr: "auto",
          }}
        >
          {appName}
        </Typography>
        <AppNavLinks
          ariaLabel="Primary"
          links={primaryNavLinks}
          fontSize={{ xs: "0.875rem", sm: "1rem" }}
        />
      </Toolbar>
    </AppBar>
  );
};
