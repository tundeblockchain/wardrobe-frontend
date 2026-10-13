import { useState, type KeyboardEvent, type ReactNode } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { isApiError } from "../../api/httpClient";
import type { ResourceApi } from "../../api/resourceApi";
import { useResourceApi } from "../../api/useResourceApi";
import { getAuthErrorMessage } from "../../auth/authErrors";
import { useAuth } from "../../auth/useAuth";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { dashboardCopy } from "../../content/dashboardCopy";
import {
  getPlanManagementCopy,
  getPlanPeriodLabel,
  getPlanStatusLabel,
  getPlanStoreLabel,
  getPlanTierLabel,
} from "../../content/planDisplay";
import { useResourceQuery } from "../../hooks/useResourceQuery";
import { appPaths } from "../../routes/paths";
import { useThemePreference } from "../../theme/useThemePreference";
import type { ThemePreference } from "../../theme/themePreference";

export type SettingsPageProps = {
  resourceApi?: ResourceApi;
};

const copy = dashboardCopy.settings;

const SettingsSection = ({
  title,
  titleId,
  children,
}: {
  title: string;
  titleId: string;
  children: ReactNode;
}) => {
  return (
    <Paper
      component="section"
      elevation={0}
      aria-labelledby={titleId}
      sx={{
        p: { xs: 2.5, md: 3 },
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack spacing={2}>
        <Typography id={titleId} variant="h3" component="h2">
          {title}
        </Typography>
        {children}
      </Stack>
    </Paper>
  );
};

export const SettingsPage = ({
  resourceApi: resourceApiProp,
}: SettingsPageProps) => {
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const { user, signOut } = useAuth();
  const { preference, handlePreferenceChange } = useThemePreference();
  const planQuery = useResourceQuery("settings-plan", resourceApi.getMe);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleThemeChange = (
    _event: unknown,
    nextPreference: ThemePreference | null,
  ) => {
    if (!nextPreference) {
      return;
    }

    handlePreferenceChange(nextPreference);
  };

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setSignOutError("");
    try {
      await signOut();
    } catch (error) {
      setSignOutError(getAuthErrorMessage(error));
      setIsSigningOut(false);
    }
  };

  const handleSignOutKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    void handleSignOut();
  };

  const handleOpenDelete = () => {
    if (isDeleting) {
      return;
    }

    setDeleteError("");
    setIsDeleteOpen(true);
  };

  const handleOpenDeleteKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleOpenDelete();
  };

  const handleCloseDelete = () => {
    if (isDeleting) {
      return;
    }

    setIsDeleteOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");
    try {
      const result = await resourceApi.deleteAccount();
      if (!result.deleted) {
        setDeleteError(copy.deleteErrorFallback);
        return;
      }

      await signOut();
    } catch (error) {
      const serverMessage = isApiError(error) ? error.message.trim() : "";
      setDeleteError(serverMessage || copy.deleteErrorFallback);
    } finally {
      setIsDeleting(false);
    }
  };

  const displayName = user?.displayName?.trim() || copy.nameEmpty;
  const email = user?.email?.trim() || copy.emailEmpty;

  return (
    <DashboardPage
      headingId="settings-heading"
      title={copy.title}
      description={copy.description}
    >
      <Stack spacing={3}>
        <SettingsSection title={copy.accountTitle} titleId="account-details-heading">
          <List disablePadding>
            <ListItem disableGutters>
              <ListItemText primary={copy.nameLabel} secondary={displayName} />
            </ListItem>
            <ListItem disableGutters>
              <ListItemText primary={copy.emailLabel} secondary={email} />
            </ListItem>
          </List>
        </SettingsSection>

        <SettingsSection title={copy.themeTitle} titleId="theme-heading">
          <Typography variant="body2" color="text.secondary">
            {copy.themeDescription}
          </Typography>
          <ToggleButtonGroup
            exclusive
            color="primary"
            value={preference}
            onChange={handleThemeChange}
            aria-label={copy.themeTitle}
          >
            <ToggleButton
              value="system"
              tabIndex={0}
              aria-label={copy.themeSystemAriaLabel}
            >
              {copy.themeSystemLabel}
            </ToggleButton>
            <ToggleButton
              value="light"
              tabIndex={0}
              aria-label={copy.themeLightAriaLabel}
            >
              {copy.themeLightLabel}
            </ToggleButton>
            <ToggleButton
              value="dark"
              tabIndex={0}
              aria-label={copy.themeDarkAriaLabel}
            >
              {copy.themeDarkLabel}
            </ToggleButton>
          </ToggleButtonGroup>
        </SettingsSection>

        <SettingsSection title={copy.planTitle} titleId="plan-heading">
          {planQuery.status === "loading" ? (
            <ResourceLoadingState label={copy.planLoadingLabel} />
          ) : null}
          {planQuery.status === "error" ? (
            <ResourceErrorState
              title={copy.planErrorTitle}
              description={copy.planErrorDescription}
              retryLabel={copy.planRetryLabel}
              onRetry={planQuery.handleRetry}
            />
          ) : null}
          {planQuery.status === "ready" ? (
            <Stack spacing={2}>
              <List disablePadding>
                <ListItem disableGutters>
                  <ListItemText
                    primary={copy.planTierLabel}
                    secondary={getPlanTierLabel(planQuery.data.tier)}
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText
                    primary={copy.planStatusLabel}
                    secondary={getPlanStatusLabel(planQuery.data.status)}
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText
                    primary={copy.planStoreLabel}
                    secondary={getPlanStoreLabel(planQuery.data.store)}
                  />
                </ListItem>
                {getPlanPeriodLabel(planQuery.data.period) ? (
                  <ListItem disableGutters>
                    <ListItemText
                      primary={copy.planPeriodLabel}
                      secondary={getPlanPeriodLabel(planQuery.data.period)}
                    />
                  </ListItem>
                ) : null}
                {planQuery.data.expiresAt ? (
                  <ListItem disableGutters>
                    <ListItemText
                      primary={copy.planExpiresLabel}
                      secondary={planQuery.data.expiresAt}
                    />
                  </ListItem>
                ) : null}
              </List>
              <Typography variant="body2" color="text.secondary">
                {getPlanManagementCopy(planQuery.data)}
              </Typography>
            </Stack>
          ) : null}
        </SettingsSection>

        <SettingsSection title={copy.legalTitle} titleId="legal-heading">
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              component={RouterLink}
              to={appPaths.terms}
              variant="outlined"
              color="primary"
              tabIndex={0}
              aria-label={copy.termsLabel}
            >
              {copy.termsLabel}
            </Button>
            <Button
              component={RouterLink}
              to={appPaths.privacy}
              variant="outlined"
              color="primary"
              tabIndex={0}
              aria-label={copy.privacyLabel}
            >
              {copy.privacyLabel}
            </Button>
          </Stack>
        </SettingsSection>

        <SettingsSection title={copy.sessionTitle} titleId="session-heading">
          {signOutError ? (
            <Alert severity="error" role="alert" aria-live="assertive">
              {signOutError}
            </Alert>
          ) : null}
          <Button
            type="button"
            variant="outlined"
            color="primary"
            onClick={() => {
              void handleSignOut();
            }}
            onKeyDown={handleSignOutKeyDown}
            tabIndex={0}
            aria-label={copy.signOutAriaLabel}
            disabled={isSigningOut || isDeleting}
          >
            {isSigningOut ? copy.signingOutLabel : copy.signOutLabel}
          </Button>
        </SettingsSection>

        <SettingsSection title={copy.dangerTitle} titleId="delete-account-heading">
          <Button
            type="button"
            variant="outlined"
            color="error"
            onClick={handleOpenDelete}
            onKeyDown={handleOpenDeleteKeyDown}
            tabIndex={0}
            aria-label={copy.deleteAccountAriaLabel}
            disabled={isDeleting || isSigningOut}
          >
            {copy.deleteAccountLabel}
          </Button>
        </SettingsSection>
      </Stack>

      <Dialog
        open={isDeleteOpen}
        onClose={handleCloseDelete}
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
      >
        <DialogTitle id="delete-account-title">
          {copy.deleteConfirmTitle}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography id="delete-account-description" variant="body2">
              {copy.deleteConfirmDescription}
            </Typography>
            {deleteError ? (
              <Alert severity="error" role="alert" aria-live="assertive">
                {deleteError}
              </Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDelete}
            color="secondary"
            tabIndex={0}
            aria-label={copy.cancelLabel}
            disabled={isDeleting}
          >
            {copy.cancelLabel}
          </Button>
          <Button
            onClick={() => {
              void handleConfirmDelete();
            }}
            color="error"
            variant="contained"
            tabIndex={0}
            aria-label={copy.deleteConfirmLabel}
            disabled={isDeleting}
          >
            {isDeleting ? copy.deletingLabel : copy.deleteConfirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardPage>
  );
};
