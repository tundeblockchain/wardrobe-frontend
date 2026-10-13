import type { KeyboardEvent } from "react";
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
import { dashboardNavItems } from "./dashboardNav";
import {
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_COLLAPSED,
} from "./sidebarCollapsed";

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
                minHeight: 48,
                justifyContent: hideLabels ? "center" : "flex-start",
                px: hideLabels ? 1.5 : 2,
                "&.active": {
                  bgcolor: "action.selected",
                  color: "primary.main",
                  "& .MuiListItemIcon-root": {
                    color: "primary.main",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: hideLabels ? 0 : 40,
                  justifyContent: "center",
                  color: "text.secondary",
                }}
              >
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
