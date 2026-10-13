import { useState, type KeyboardEvent } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import { AppBar, Box, Drawer, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { getPublicAppEnv } from "../config/env";
import { AuthNavActions } from "./AuthNavActions";
import { AppNavLinks } from "./AppNavLinks";
import { primaryNavLinks } from "./landingNav";
import { appPaths } from "../routes/paths";

const MOBILE_MENU_ID = "landing-mobile-menu";

export const AppHeader = () => {
  const { appName } = getPublicAppEnv();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleOpenMobileMenu = () => {
    setMobileMenuOpen(true);
  };

  const handleCloseMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleOpenMobileMenuKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleOpenMobileMenu();
  };

  return (
    <>
      <AppBar position="sticky" color="primary" component="header">
        <Toolbar
          sx={{
            gap: 2,
            flexWrap: "nowrap",
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
              minWidth: 0,
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
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 2,
            }}
          >
            <AppNavLinks
              ariaLabel="Primary"
              links={primaryNavLinks}
              fontSize={{ xs: "0.875rem", sm: "1rem" }}
            />
            <AuthNavActions layout="toolbar" />
          </Box>
          <IconButton
            type="button"
            color="inherit"
            edge="end"
            onClick={handleOpenMobileMenu}
            onKeyDown={handleOpenMobileMenuKeyDown}
            tabIndex={0}
            aria-label="Open menu"
            aria-controls={MOBILE_MENU_ID}
            aria-haspopup="true"
            aria-expanded={mobileMenuOpen ? "true" : "false"}
            sx={{ display: { xs: "inline-flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleCloseMobileMenu}
        ModalProps={{ keepMounted: false }}
      >
        <Stack
          id={MOBILE_MENU_ID}
          spacing={3}
          sx={{ width: 280, p: 3 }}
          aria-label="Mobile menu"
        >
          <AppNavLinks
            ariaLabel="Mobile"
            links={primaryNavLinks}
            flexDirection="column"
            fontSize="1rem"
          />
          <AuthNavActions layout="menu" onNavigate={handleCloseMobileMenu} />
        </Stack>
      </Drawer>
    </>
  );
};
