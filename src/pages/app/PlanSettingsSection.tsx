import { useState, type KeyboardEvent } from "react";
import {
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  assignBillingUrl as defaultAssignBillingUrl,
  getBillingCheckoutErrorMessage,
  isNotStripePlanError,
  readBillingSessionUrl,
} from "../../api/billing";
import type { ResourceApi } from "../../api/resourceApi";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { dashboardCopy } from "../../content/dashboardCopy";
import {
  getPaidPlanLabel,
  getPaidTier,
  getPaidTierStoreManagementCopy,
  getPlanExpiresLabel,
  isStripePaidTier,
} from "../../content/planDisplay";
import { useResourceQuery } from "../../hooks/useResourceQuery";
import { appPaths, SETTINGS_PLAN_HASH } from "../../routes/paths";

const copy = dashboardCopy.settings;

export type PlanSettingsSectionProps = {
  resourceApi: ResourceApi;
  assignBillingUrl?: (url: string) => void;
};

export const PlanSettingsSection = ({
  resourceApi,
  assignBillingUrl = defaultAssignBillingUrl,
}: PlanSettingsSectionProps) => {
  const { hash } = useLocation();
  const planQuery = useResourceQuery("settings-plan", resourceApi.getMe);
  const [isManaging, setIsManaging] = useState(false);
  const [billingError, setBillingError] = useState("");

  const handleSectionRef = (node: HTMLElement | null) => {
    if (!node || hash !== `#${SETTINGS_PLAN_HASH}`) {
      return;
    }

    if (typeof node.scrollIntoView !== "function") {
      return;
    }

    node.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleBillingFailure = (error: unknown, fallback: string) => {
    if (isNotStripePlanError(error)) {
      planQuery.handleRetry();
      return;
    }

    setBillingError(getBillingCheckoutErrorMessage(error, fallback));
  };

  const handleManageSubscription = async () => {
    if (isManaging) {
      return;
    }

    setIsManaging(true);
    setBillingError("");
    try {
      const session = await resourceApi.createPortalSession();
      assignBillingUrl(readBillingSessionUrl(session));
    } catch (error) {
      handleBillingFailure(error, copy.planManageErrorFallback);
    } finally {
      setIsManaging(false);
    }
  };

  const handleManageSubscriptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    void handleManageSubscription();
  };

  const paidTier =
    planQuery.status === "ready" ? getPaidTier(planQuery.data) : null;
  const expiresLabel =
    planQuery.status === "ready"
      ? getPlanExpiresLabel(paidTier?.expiresAt ?? planQuery.data.expiresAt)
      : undefined;

  return (
    <Paper
      ref={handleSectionRef}
      component="section"
      id={SETTINGS_PLAN_HASH}
      elevation={0}
      tabIndex={-1}
      aria-labelledby="plan-heading"
      sx={{
        p: { xs: 2.5, md: 3 },
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        scrollMarginTop: 88,
        outline: "none",
      }}
    >
      <Stack spacing={2}>
        <Typography id="plan-heading" variant="h3" component="h2">
          {copy.planTitle}
        </Typography>
        {planQuery.status === "ready" ? (
          <List disablePadding>
            <ListItem disableGutters>
              <ListItemText
                primary={copy.planTierLabel}
                secondary={getPaidPlanLabel(paidTier)}
              />
            </ListItem>
            {expiresLabel ? (
              <ListItem disableGutters>
                <ListItemText
                  primary={copy.planExpiresLabel}
                  secondary={expiresLabel}
                />
              </ListItem>
            ) : null}
          </List>
        ) : null}
        <Button
          component={RouterLink}
          to={appPaths.appPricing}
          variant="outlined"
          color="primary"
          tabIndex={0}
          aria-label={dashboardCopy.billing.comparePlansAriaLabel}
        >
          {dashboardCopy.billing.comparePlansLabel}
        </Button>
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
            {billingError ? (
              <Alert severity="error" role="alert" aria-live="assertive">
                {billingError}
              </Alert>
            ) : null}
            {isStripePaidTier(paidTier) ? (
              <Button
                type="button"
                variant="contained"
                color="primary"
                onClick={() => {
                  void handleManageSubscription();
                }}
                onKeyDown={handleManageSubscriptionKeyDown}
                tabIndex={0}
                aria-label={copy.planManageAriaLabel}
                disabled={isManaging}
              >
                {isManaging ? copy.planManagingLabel : copy.planManageLabel}
              </Button>
            ) : paidTier ? (
              <Typography variant="body2" color="text.secondary">
                {getPaidTierStoreManagementCopy(paidTier.source)}
              </Typography>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
};
