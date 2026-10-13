import { Suspense, useState } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Outlet } from "react-router-dom";
import { SkipLink } from "../SkipLink";
import { AppFooter } from "../../layout/AppFooter";
import { AppMain } from "../../layout/AppMain";
import { RouteFallback } from "../../routes/RouteFallback";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import {
  readSidebarCollapsed,
  writeSidebarCollapsed,
} from "./sidebarCollapsed";

export const DashboardLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        data-testid="dashboard-content"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          ml: 0,
          pt: { xs: 7, sm: 8 },
        }}
      >
        <AppMain>
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </AppMain>
        <AppFooter />
      </Box>
    </Box>
  );
};
