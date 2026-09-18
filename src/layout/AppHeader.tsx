import { AppBar, Box, Link, Toolbar, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { getPublicAppEnv } from "../config/env";
import { landingNavLinks } from "./landingNav";

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
          to="/"
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
        <Box
          component="nav"
          aria-label="Page sections"
          sx={{
            display: "flex",
            gap: { xs: 1.5, sm: 2.5 },
            flexWrap: "wrap",
          }}
        >
          {landingNavLinks.map((navLink) => (
            <Link
              key={navLink.href}
              href={navLink.href}
              color="inherit"
              underline="hover"
              tabIndex={0}
              aria-label={navLink.ariaLabel}
              sx={{ fontWeight: 500, fontSize: { xs: "0.875rem", sm: "1rem" } }}
            >
              {navLink.label}
            </Link>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
