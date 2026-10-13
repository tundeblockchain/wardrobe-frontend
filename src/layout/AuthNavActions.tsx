import type { KeyboardEvent } from "react";
import { Button, Stack } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { appPaths, getLoginSignupPath } from "../routes/paths";

export type AuthNavActionsLayout = "toolbar" | "menu";

export type AuthNavActionsProps = {
  layout: AuthNavActionsLayout;
  onNavigate?: () => void;
};

export const AuthNavActions = ({
  layout,
  onNavigate,
}: AuthNavActionsProps) => {
  const { user } = useAuth();
  const isMenu = layout === "menu";
  const isSignedIn = Boolean(user);

  const handleNavigate = () => {
    onNavigate?.();
  };

  const handleNavigateKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    onNavigate?.();
  };

  if (isSignedIn) {
    return (
      <Stack
        component="nav"
        aria-label="Account"
        direction={isMenu ? "column" : "row"}
        spacing={1}
        sx={{ alignItems: isMenu ? "stretch" : "center" }}
      >
        <Button
          component={RouterLink}
          to={appPaths.app}
          variant="contained"
          color={isMenu ? "primary" : "secondary"}
          fullWidth={isMenu}
          tabIndex={0}
          aria-label="Dashboard"
          onClick={handleNavigate}
          onKeyDown={handleNavigateKeyDown}
        >
          Dashboard
        </Button>
      </Stack>
    );
  }

  return (
    <Stack
      component="nav"
      aria-label="Account"
      direction={isMenu ? "column" : "row"}
      spacing={1}
      sx={{ alignItems: isMenu ? "stretch" : "center" }}
    >
      <Button
        component={RouterLink}
        to={appPaths.login}
        variant={isMenu ? "outlined" : "text"}
        color={isMenu ? "primary" : "inherit"}
        fullWidth={isMenu}
        tabIndex={0}
        aria-label="Log in"
        onClick={handleNavigate}
        onKeyDown={handleNavigateKeyDown}
      >
        Log in
      </Button>
      <Button
        component={RouterLink}
        to={getLoginSignupPath()}
        variant="contained"
        color={isMenu ? "primary" : "secondary"}
        fullWidth={isMenu}
        tabIndex={0}
        aria-label="Sign up"
        onClick={handleNavigate}
        onKeyDown={handleNavigateKeyDown}
      >
        Sign up
      </Button>
    </Stack>
  );
};
