import { AppBar, Toolbar, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { getPublicAppEnv } from "../config/env";

export const AppHeader = () => {
  const { appName } = getPublicAppEnv();

  return (
    <AppBar position="sticky" color="primary" component="header">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          tabIndex={0}
          aria-label={`${appName} home`}
          sx={{
            color: "inherit",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          {appName}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};
