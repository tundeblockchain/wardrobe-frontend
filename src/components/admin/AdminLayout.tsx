import { AppBar, Box, Button, Stack, Toolbar, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";
import { supportCopy } from "../../admin/supportCopy";
import { useAdminAuth } from "../../admin/useAdminAuth";
import { SkipLink } from "../SkipLink";
import { AppMain } from "../../layout/AppMain";
import { DashboardThemeProvider } from "../../theme/DashboardThemeProvider";
import { useThemePreference } from "../../theme/useThemePreference";
import { AdminAuthGate } from "./AdminAuthGate";

const AdminChrome = () => {
  const { gate, signOut } = useAdminAuth();
  const { resolvedMode, handlePreferenceChange } = useThemePreference();
  const showSessionActions = gate === "ready";

  const handleSignOut = () => {
    void signOut();
  };

  const handleThemeClick = () => {
    handlePreferenceChange(resolvedMode === "dark" ? "light" : "dark");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <SkipLink targetId="main-content" />
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar
          sx={{
            gap: 2,
            justifyContent: "space-between",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" component="p">
            {supportCopy.title}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              type="button"
              variant="text"
              color="inherit"
              onClick={handleThemeClick}
              tabIndex={0}
              aria-label={supportCopy.themeLabel}
            >
              {resolvedMode === "dark"
                ? supportCopy.themeLight
                : supportCopy.themeDark}
            </Button>
            {showSessionActions ? (
              <Button
                type="button"
                variant="outlined"
                color="inherit"
                onClick={handleSignOut}
                tabIndex={0}
                aria-label={supportCopy.signOutLabel}
              >
                {supportCopy.signOutLabel}
              </Button>
            ) : null}
          </Stack>
        </Toolbar>
      </AppBar>
      <AppMain>
        <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, flex: 1 }}>
          <AdminAuthGate>
            <Outlet />
          </AdminAuthGate>
        </Box>
      </AppMain>
    </Box>
  );
};

export const AdminLayout = () => {
  return (
    <DashboardThemeProvider>
      <AdminChrome />
    </DashboardThemeProvider>
  );
};
