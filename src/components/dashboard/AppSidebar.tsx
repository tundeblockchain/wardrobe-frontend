import type { KeyboardEvent } from "react";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { NavLink } from "react-router-dom";
import { useLogOut } from "../../auth/useLogOut";
import { dashboardLogOutLabel, dashboardNavItems } from "./dashboardNav";
import {
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_COLLAPSED,
} from "./sidebarCollapsed";

const getNavItemButtonSx = (hideLabels: boolean) => ({
  width: "100%",
  minHeight: 48,
  justifyContent: hideLabels ? "center" : "flex-start",
  px: hideLabels ? 1.5 : 2,
});

const getNavItemIconSx = (hideLabels: boolean) => ({
  minWidth: hideLabels ? 0 : 40,
  justifyContent: "center",
  color: "text.secondary",
});

export type AppSidebarProps = {
  collapsed: boolean;
  isMobile: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

const getDrawerPaperSx = (drawerWidth: number) => ({
  width: drawerWidth,
  boxSizing: "border-box" as const,
  overflowX: "hidden" as const,
  bgcolor: "background.paper",
  borderRight: 1,
  borderColor: "divider",
});

export const AppSidebar = ({
  collapsed,
  isMobile,
  mobileOpen,
  onCloseMobile,
}: AppSidebarProps) => {
  const hideLabels = collapsed && !isMobile;
  const drawerWidth = hideLabels ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;
  const { isLoggingOut, handleLogOut } = useLogOut();

  const handleNavClick = () => {
    if (isMobile) {
      onCloseMobile();
    }
  };

  const handleNavKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    handleNavClick();
  };

  const handleLogOutClick = () => {
    if (isMobile) {
      onCloseMobile();
    }

    void handleLogOut();
  };

  const handleLogOutKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleLogOutClick();
  };

  const logOutButton = (
    <ListItemButton
      component="button"
      type="button"
      tabIndex={0}
      aria-label={dashboardLogOutLabel}
      disabled={isLoggingOut}
      onClick={handleLogOutClick}
      onKeyDown={handleLogOutKeyDown}
      sx={getNavItemButtonSx(hideLabels)}
    >
      <ListItemIcon sx={getNavItemIconSx(hideLabels)}>
        <LogoutOutlined />
      </ListItemIcon>
      {hideLabels ? null : (
        <ListItemText primary={dashboardLogOutLabel} />
      )}
    </ListItemButton>
  );

  const drawerContent = (
    <Box
      component="nav"
      aria-label="App"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        py: 1,
      }}
    >
      <List disablePadding>
        {dashboardNavItems.map((item) => {
          const { Icon } = item;
          const linkButton = (
            <ListItemButton
              component={NavLink}
              to={item.path}
              end={item.end}
              tabIndex={0}
              aria-label={item.label}
              onClick={handleNavClick}
              onKeyDown={handleNavKeyDown}
              sx={{
                ...getNavItemButtonSx(hideLabels),
                "&.active": {
                  bgcolor: "action.selected",
                  color: "primary.main",
                  "& .MuiListItemIcon-root": {
                    color: "primary.main",
                  },
                },
              }}
            >
              <ListItemIcon sx={getNavItemIconSx(hideLabels)}>
                <Icon />
              </ListItemIcon>
              {hideLabels ? null : <ListItemText primary={item.label} />}
            </ListItemButton>
          );

          return (
            <ListItem key={item.id} disablePadding sx={{ display: "block" }}>
              {hideLabels ? (
                <Tooltip title={item.label} placement="right">
                  {linkButton}
                </Tooltip>
              ) : (
                linkButton
              )}
            </ListItem>
          );
        })}
      </List>
      <List disablePadding sx={{ mt: "auto" }}>
        <ListItem disablePadding sx={{ display: "block" }}>
          {hideLabels ? (
            <Tooltip title={dashboardLogOutLabel} placement="right">
              {logOutButton}
            </Tooltip>
          ) : (
            logOutButton
          )}
        </ListItem>
      </List>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onCloseMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": getDrawerPaperSx(SIDEBAR_WIDTH),
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      open
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": getDrawerPaperSx(drawerWidth),
      }}
    >
      {drawerContent}
    </Drawer>
  );
};
