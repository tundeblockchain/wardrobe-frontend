import { useState, type KeyboardEvent, type MouseEvent } from "react";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpen from "@mui/icons-material/MenuOpen";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { getAuthErrorMessage } from "../../auth/authErrors";
import type { AuthUser } from "../../auth/authContext";
import { useAuth } from "../../auth/useAuth";
import { getPublicAppEnv } from "../../config/env";
import { appPaths } from "../../routes/paths";
import {
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_COLLAPSED,
} from "./sidebarCollapsed";

export type TopBarProps = {
  collapsed: boolean;
  isMobile: boolean;
  onToggleSidebar: () => void;
};

const getAccountInitials = (user: AuthUser | null): string => {
  const source = user?.displayName?.trim() || user?.email?.trim() || "";
  if (!source) {
    return "P";
  }

  return source.charAt(0).toUpperCase();
};

export const TopBar = ({
  collapsed,
  isMobile,
  onToggleSidebar,
}: TopBarProps) => {
  const { appName } = getPublicAppEnv();
  const { user, signOut } = useAuth();
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const menuOpen = Boolean(menuAnchorEl);
  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;

  const sidebarToggleLabel = isMobile
    ? "Open navigation"
    : collapsed
      ? "Expand sidebar"
      : "Collapse sidebar";

  const SidebarToggleIcon = isMobile
    ? MenuIcon
    : collapsed
      ? MenuOpen
      : ChevronLeft;

  const handleToggleSidebar = () => {
    onToggleSidebar();
  };

  const handleToggleSidebarKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onToggleSidebar();
  };

  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleOpenMenuKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setErrorMessage("");
    handleCloseMenu();
    try {
      await signOut();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
      setIsSigningOut(false);
    }
  };

  const handleSignOutKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    void handleSignOut();
  };

  const handleCloseError = () => {
    setErrorMessage("");
  };

  return (
    <>
      <AppBar
        position="fixed"
        color="primary"
        component="header"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          ml: isMobile ? 0 : `${sidebarWidth}px`,
          width: isMobile ? "100%" : `calc(100% - ${sidebarWidth}px)`,
          transition: (theme) =>
            theme.transitions.create(["margin-left", "width"], {
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        <Toolbar
          sx={{
            gap: 1,
            minHeight: { xs: 56, sm: 64 },
          }}
        >
          <IconButton
            type="button"
            color="inherit"
            edge="start"
            onClick={handleToggleSidebar}
            onKeyDown={handleToggleSidebarKeyDown}
            tabIndex={0}
            aria-label={sidebarToggleLabel}
          >
            <SidebarToggleIcon />
          </IconButton>
          <Box
            component={RouterLink}
            to={appPaths.app}
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
                height: { xs: 32, sm: 40 },
                width: "auto",
                display: "block",
                borderRadius: 1,
              }}
            />
            <Typography
              variant="h6"
              component="span"
              sx={{
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {appName}
            </Typography>
          </Box>
          <IconButton
            type="button"
            color="inherit"
            onClick={handleOpenMenu}
            onKeyDown={handleOpenMenuKeyDown}
            tabIndex={0}
            aria-label="Account menu"
            aria-controls={menuOpen ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? "true" : undefined}
            disabled={isSigningOut}
          >
            <Avatar
              alt={user?.email ?? user?.displayName ?? "Account"}
              sx={{
                width: 36,
                height: 36,
                bgcolor: "secondary.main",
                color: "secondary.contrastText",
                fontSize: "0.95rem",
              }}
            >
              {getAccountInitials(user)}
            </Avatar>
          </IconButton>
          <Menu
            id="account-menu"
            anchorEl={menuAnchorEl}
            open={menuOpen}
            onClose={handleCloseMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{
              list: {
                "aria-label": "Account menu",
              },
            }}
          >
            {user?.email ? (
              <MenuItem disabled aria-label={`Signed in as ${user.email}`}>
                {user.email}
              </MenuItem>
            ) : null}
            <MenuItem
              component={RouterLink}
              to={appPaths.appSettings}
              onClick={handleCloseMenu}
              tabIndex={0}
              aria-label="Profile & Settings"
            >
              Profile & Settings
            </MenuItem>
            <MenuItem
              onClick={handleSignOut}
              onKeyDown={handleSignOutKeyDown}
              tabIndex={0}
              aria-label="Sign out"
              disabled={isSigningOut}
            >
              {isSigningOut ? "Signing out…" : "Sign out"}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Snackbar
        open={errorMessage.length > 0}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          role="alert"
          aria-live="assertive"
          onClose={handleCloseError}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
