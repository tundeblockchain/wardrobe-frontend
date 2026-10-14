import {
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  Alert,
  Badge,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { isApiError } from "../../api/httpClient";
import type { ResourceApi } from "../../api/resourceApi";
import { useResourceApi } from "../../api/useResourceApi";
import { getAuthErrorMessage } from "../../auth/authErrors";
import { getSignedInWithLabel } from "../../auth/authProviderLabel";
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
import { invalidateResourceQueries } from "../../hooks/resourceQueryInvalidation";
import { useResourceQuery } from "../../hooks/useResourceQuery";
import { appPaths, getContactPath } from "../../routes/paths";
import { useThemePreference } from "../../theme/useThemePreference";
import type { ThemePreference } from "../../theme/themePreference";

export type SettingsPageProps = {
  resourceApi?: ResourceApi;
};

const copy = dashboardCopy.settings;

type ConfirmPhraseDialogProps = {
  open: boolean;
  titleId: string;
  descriptionId: string;
  title: string;
  description: string;
  extra?: ReactNode;
  phrase: string;
  phraseValue: string;
  phraseLabel: string;
  confirmLabel: string;
  confirmingLabel: string;
  confirmAriaLabel: string;
  cancelLabel: string;
  error: string;
  isConfirming: boolean;
  onPhraseChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

const ConfirmPhraseDialog = ({
  open,
  titleId,
  descriptionId,
  title,
  description,
  extra,
  phrase,
  phraseValue,
  phraseLabel,
  confirmLabel,
  confirmingLabel,
  confirmAriaLabel,
  cancelLabel,
  error,
  isConfirming,
  onPhraseChange,
  onClose,
  onConfirm,
}: ConfirmPhraseDialogProps) => {
  const canConfirm = phraseValue.trim() === phrase;

  const handlePhraseChange = (event: ChangeEvent<HTMLInputElement>) => {
    onPhraseChange(event.target.value);
  };

  const handleConfirmKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    if (!canConfirm || isConfirming) {
      return;
    }

    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography id={descriptionId} variant="body2">
            {description}
          </Typography>
          {extra}
          <TextField
            value={phraseValue}
            onChange={handlePhraseChange}
            label={phraseLabel}
            autoComplete="off"
            fullWidth
            disabled={isConfirming}
            slotProps={{
              htmlInput: {
                "aria-label": phraseLabel,
                "aria-required": true,
              },
            }}
          />
          {error ? (
            <Alert severity="error" role="alert" aria-live="assertive">
              {error}
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="secondary"
          tabIndex={0}
          aria-label={cancelLabel}
          disabled={isConfirming}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          onKeyDown={handleConfirmKeyDown}
          color="error"
          variant="contained"
          tabIndex={0}
          aria-label={confirmAriaLabel}
          disabled={!canConfirm || isConfirming}
        >
          {isConfirming ? confirmingLabel : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

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

const getInboxAriaLabel = (unreadCount: number): string => {
  if (unreadCount <= 0) {
    return copy.inboxAriaLabel;
  }

  return `${copy.inboxUnreadAriaLabel}: ${unreadCount}`;
};

export const SettingsPage = ({
  resourceApi: resourceApiProp,
}: SettingsPageProps) => {
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const { user, signOut } = useAuth();
  const { preference, handlePreferenceChange } = useThemePreference();
  const planQuery = useResourceQuery("settings-plan", resourceApi.getMe);
  const inboxQuery = useResourceQuery("settings-inbox", resourceApi.listJobEvents);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [clearPhrase, setClearPhrase] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState("");
  const [clearSuccess, setClearSuccess] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const unreadCount =
    inboxQuery.status === "ready" ? inboxQuery.data.unreadCount : 0;
  const isBusy = isSigningOut || isClearing || isDeleting;

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

  const handleOpenClear = () => {
    if (isClearing) {
      return;
    }

    setClearError("");
    setClearPhrase("");
    setIsClearOpen(true);
  };

  const handleOpenClearKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleOpenClear();
  };

  const handleCloseClear = () => {
    if (isClearing) {
      return;
    }

    setIsClearOpen(false);
  };

  const handleConfirmClear = async () => {
    if (isClearing || clearPhrase.trim() !== copy.clearContentConfirmPhrase) {
      return;
    }

    setIsClearing(true);
    setClearError("");
    setClearSuccess("");
    try {
      await resourceApi.clearContent();
      invalidateResourceQueries();
      setIsClearOpen(false);
      setClearPhrase("");
      setClearSuccess(copy.clearContentSuccess);
    } catch (error) {
      const serverMessage = isApiError(error) ? error.message.trim() : "";
      setClearError(serverMessage || copy.clearContentErrorFallback);
    } finally {
      setIsClearing(false);
    }
  };

  const handleOpenDelete = () => {
    if (isDeleting) {
      return;
    }

    setDeleteError("");
    setDeletePhrase("");
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
    if (isDeleting || deletePhrase.trim() !== copy.deleteConfirmPhrase) {
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
  const signedInWithLabel = getSignedInWithLabel(user?.provider);
  const deleteConfirmLabel = deleteError
    ? copy.retryDeleteLabel
    : copy.deleteConfirmLabel;
  const deleteConfirmAriaLabel = deleteError
    ? copy.retryDeleteAriaLabel
    : copy.deleteConfirmLabel;

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
            <ListItem disableGutters>
              <ListItemText
                primary={copy.providerLabel}
                secondary={signedInWithLabel}
              />
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

        <SettingsSection
          title={copy.virtualTryOnTitle}
          titleId="virtual-try-on-heading"
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ alignItems: { sm: "center" } }}
          >
            <Button
              component={RouterLink}
              to={appPaths.appVirtualTryOn}
              variant="outlined"
              color="primary"
              tabIndex={0}
              aria-label={copy.virtualTryOnAriaLabel}
            >
              {copy.virtualTryOnLabel}
            </Button>
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={copy.virtualTryOnPremiumLabel}
              aria-label={copy.virtualTryOnPremiumLabel}
            />
          </Stack>
        </SettingsSection>

        <SettingsSection title={copy.inboxTitle} titleId="inbox-heading">
          <Badge
            color="primary"
            badgeContent={unreadCount}
            invisible={unreadCount <= 0}
            overlap="rectangular"
          >
            <Button
              component={RouterLink}
              to={appPaths.appInbox}
              variant="outlined"
              color="primary"
              tabIndex={0}
              aria-label={getInboxAriaLabel(unreadCount)}
            >
              {copy.inboxLabel}
            </Button>
          </Badge>
        </SettingsSection>

        <SettingsSection title={copy.supportTitle} titleId="support-heading">
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              component={RouterLink}
              to={appPaths.contact}
              variant="outlined"
              color="primary"
              tabIndex={0}
              aria-label={copy.contactAriaLabel}
            >
              {copy.contactLabel}
            </Button>
            <Button
              component={RouterLink}
              to={getContactPath("bug")}
              variant="outlined"
              color="primary"
              tabIndex={0}
              aria-label={copy.reportBugAriaLabel}
            >
              {copy.reportBugLabel}
            </Button>
          </Stack>
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
            disabled={isBusy}
          >
            {isSigningOut ? copy.signingOutLabel : copy.signOutLabel}
          </Button>
        </SettingsSection>

        <SettingsSection
          title={copy.clearContentTitle}
          titleId="clear-content-heading"
        >
          {clearSuccess ? (
            <Alert severity="success" role="status" aria-live="polite">
              {clearSuccess}
            </Alert>
          ) : null}
          <Typography variant="body2" color="text.secondary">
            {copy.clearContentDescription}
          </Typography>
          <Button
            type="button"
            variant="outlined"
            color="error"
            onClick={handleOpenClear}
            onKeyDown={handleOpenClearKeyDown}
            tabIndex={0}
            aria-label={copy.clearContentAriaLabel}
            disabled={isBusy}
          >
            {copy.clearContentLabel}
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
            disabled={isBusy}
          >
            {copy.deleteAccountLabel}
          </Button>
        </SettingsSection>
      </Stack>

      <ConfirmPhraseDialog
        open={isClearOpen}
        titleId="clear-content-title"
        descriptionId="clear-content-description"
        title={copy.clearContentConfirmTitle}
        description={copy.clearContentConfirmDescription}
        phrase={copy.clearContentConfirmPhrase}
        phraseValue={clearPhrase}
        phraseLabel={copy.clearContentPhraseLabel}
        confirmLabel={copy.clearContentConfirmLabel}
        confirmingLabel={copy.clearingContentLabel}
        confirmAriaLabel={copy.clearContentConfirmLabel}
        cancelLabel={copy.cancelLabel}
        error={clearError}
        isConfirming={isClearing}
        onPhraseChange={setClearPhrase}
        onClose={handleCloseClear}
        onConfirm={() => {
          void handleConfirmClear();
        }}
      />

      <ConfirmPhraseDialog
        open={isDeleteOpen}
        titleId="delete-account-title"
        descriptionId="delete-account-description"
        title={copy.deleteConfirmTitle}
        description={copy.deleteConfirmDescription}
        extra={
          <Alert severity="warning" role="status">
            {copy.deleteStoreWarning}
          </Alert>
        }
        phrase={copy.deleteConfirmPhrase}
        phraseValue={deletePhrase}
        phraseLabel={copy.deletePhraseLabel}
        confirmLabel={deleteConfirmLabel}
        confirmingLabel={copy.deletingLabel}
        confirmAriaLabel={deleteConfirmAriaLabel}
        cancelLabel={copy.cancelLabel}
        error={deleteError}
        isConfirming={isDeleting}
        onPhraseChange={setDeletePhrase}
        onClose={handleCloseDelete}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </DashboardPage>
  );
};
