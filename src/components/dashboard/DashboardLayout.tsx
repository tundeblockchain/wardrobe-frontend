import { Suspense, useState } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Outlet } from "react-router-dom";
import { SkipLink } from "../SkipLink";
import { AppMain } from "../../layout/AppMain";
import { RouteFallback } from "../../routes/RouteFallback";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import {
  readSidebarCollapsed,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_COLLAPSED,
  writeSidebarCollapsed,
} from "./sidebarCollapsed";

export const DashboardLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;

  const handleToggleCollapsed = () => {
    const nextCollapsed = !collapsed;
    setCollapsed(nextCollapsed);
    writeSidebarCollapsed(nextCollapsed);
  };

  const handleToggleMobileDrawer = () => {
    setMobileOpen((isOpen) => !isOpen);
  };

  const handleCloseMobileDrawer = () => {
    setMobileOpen(false);
  };

  const handleToggleSidebar = () => {
    if (isMobile) {
      handleToggleMobileDrawer();
      return;
    }

    handleToggleCollapsed();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "background.default",
        backgroundImage: (currentTheme) => currentTheme.gradients.page,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <SkipLink targetId="main-content" />
      <TopBar
        collapsed={collapsed}
        isMobile={isMobile}
        onToggleSidebar={handleToggleSidebar}
      />
      <AppSidebar
        collapsed={collapsed}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onCloseMobile={handleCloseMobileDrawer}
      />
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          ml: isMobile ? 0 : `${sidebarWidth}px`,
          pt: { xs: 7, sm: 8 },
          transition: theme.transitions.create("margin-left", {
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <AppMain>
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </AppMain>
      </Box>
    </Box>
  );
};
