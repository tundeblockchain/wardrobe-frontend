import { useState, type KeyboardEvent } from "react";
import { Alert, Button, Container, Stack, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import {
  canStartWebCheckout,
  DEFAULT_BILLING_INTERVAL,
  isStoreManagedPaidTier,
  type BillingInterval,
  type CheckoutTier,
} from "../api/billing";
import {
  fetchBillingPlans,
  findBillingPlan,
  formatBillingPrice,
  getPlansUnavailableMessage,
  type FetchBillingPlansFn,
} from "../api/billingPlans";
import type { Entitlement, PaidPlanTier, PaidTier } from "../api/resourceTypes";
import { useApi } from "../api/useApi";
import { useAuth } from "../auth/useAuth";
import { BillingIntervalToggle } from "../components/billing/BillingIntervalToggle";
import { DashboardPage } from "../components/dashboard/DashboardPage";
import { DashboardPaper } from "../components/dashboard/DashboardPaper";
import { ResourceLoadingState } from "../components/dashboard/ResourceLoadingState";
import { PricingPlanCard } from "../components/pricing/PricingPlanCard";
import { StatusCard } from "../components/StatusCard";
import { SectionSurface } from "../components/surfaces/SectionSurface";
import { getPublicAppEnv } from "../config/env";
import { getPaidTier } from "../content/planDisplay";
import { DashboardThemeProvider } from "../theme/DashboardThemeProvider";
import {
  getBasicPlanFeatureLines,
  getFreePlanFeatureLines,
  getPremiumPlanFeatureLines,
  pricingCopy,
} from "../content/pricingCopy";
import { dashboardCopy } from "../content/dashboardCopy";
import {
  useCheckoutAction,
  type CheckoutGetMeFn,
  type StartCheckoutFn,
} from "../hooks/useCheckoutAction";
import { useResourceQuery } from "../hooks/useResourceQuery";
import {
  getLoginPath,
  getLoginSignupPath,
  isAppPath,
} from "../routes/paths";

export type PricingPageProps = {
  fetchPlans?: FetchBillingPlansFn;
  startCheckout?: StartCheckoutFn;
  getMe?: CheckoutGetMeFn;
  assignLocation?: (url: string) => void;
};

type PricingTier = "free" | PaidPlanTier;

type PricingEntitlement = Pick<Entitlement, "paidTier"> &
  Partial<Pick<Entitlement, "limits" | "tier">>;

const copy = pricingCopy;

const getCurrentPricingTier = (
  userId: string | undefined,
  entitlement: PricingEntitlement | null | undefined,
): PricingTier | undefined => {
  if (!userId || entitlement == null) {
    return undefined;
  }

  if ("paidTier" in entitlement) {
    return entitlement.paidTier?.tier ?? "free";
  }

  return getPaidTier(entitlement as Entitlement)?.tier ?? "free";
};

const getPaidTierFromEntitlement = (
  entitlement: PricingEntitlement | null | undefined,
): PaidTier => {
  if (entitlement == null) {
    return null;
  }

  if ("paidTier" in entitlement) {
    return entitlement.paidTier ?? null;
  }

  return getPaidTier(entitlement as Entitlement);
};

export const PricingPage = ({
  fetchPlans = fetchBillingPlans,
  startCheckout,
  getMe,
  assignLocation,
}: PricingPageProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const api = useApi();
  const { appName } = getPublicAppEnv();
  const isDashboard = isAppPath(location.pathname);
  const pricingPath = `${location.pathname}${location.search}`;
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(
    DEFAULT_BILLING_INTERVAL,
  );
  const {
    isStarting,
    error,
    alreadySubscribedMessage,
    existingPaidTier,
    handleCheckout,
  } = useCheckoutAction({ startCheckout, getMe, assignLocation });

  const plansQuery = useResourceQuery("billing-plans", fetchPlans);
  const entitlementLoader = (): Promise<PricingEntitlement | null> => {
    if (!user) {
      return Promise.resolve(null);
    }

    return (getMe ?? api.getMe)();
  };
  const entitlementQuery = useResourceQuery(
    user ? `pricing-me:${user.id}` : "pricing-me:anon",
    entitlementLoader,
  );

  const handleIntervalChange = (nextInterval: BillingInterval) => {
    setBillingInterval(nextInterval);
  };

  const handleRetry = () => {
    plansQuery.handleRetry();
  };

  const handleRetryKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleRetry();
  };

  const handleSignedOutUpgrade = () => {
    navigate(getLoginPath(pricingPath));
  };

  const handleUpgrade = (tier: CheckoutTier) => {
    if (!user) {
      handleSignedOutUpgrade();
      return;
    }

    void handleCheckout(tier, billingInterval);
  };

  const entitlement =
    entitlementQuery.status === "ready" ? entitlementQuery.data : undefined;
  const currentTier = getCurrentPricingTier(user?.id, entitlement);
  const paidTier = existingPaidTier ?? getPaidTierFromEntitlement(entitlement);
  const storeManaged = isStoreManagedPaidTier(paidTier);
  const canCheckout = canStartWebCheckout(paidTier);
  const plans = plansQuery.status === "ready" ? plansQuery.data.plans : [];
  const basicPlan = findBillingPlan(plans, "basic", billingInterval);
  const premiumPlan = findBillingPlan(plans, "premium", billingInterval);
  const intervalHint =
    billingInterval === "yearly"
      ? copy.yearlyPriceSuffix
      : copy.monthlyPriceSuffix;

  const getPaidCardAction = (tier: CheckoutTier) => {
    const selectedPlan = findBillingPlan(plans, tier, billingInterval);
    const isCurrent = currentTier === tier;
    const actionLabel =
      tier === "basic" ? copy.upgradeBasicLabel : copy.upgradePremiumLabel;
    const actionAriaLabel =
      tier === "basic"
        ? copy.upgradeBasicAriaLabel
        : copy.upgradePremiumAriaLabel;

    if (isCurrent) {
      return undefined;
    }

    if (storeManaged) {
      return undefined;
    }

    if (!user) {
      return {
        label: copy.signInToUpgradeLabel,
        ariaLabel:
          tier === "basic"
            ? copy.signInToUpgradeBasicAriaLabel
            : copy.signInToUpgradePremiumAriaLabel,
        onClick: handleSignedOutUpgrade,
      };
    }

    if (!selectedPlan) {
      return {
        label: copy.upgradeUnavailableLabel,
        ariaLabel: copy.upgradeUnavailableAriaLabel,
        disabled: true,
      };
    }

    if (!canCheckout) {
      return {
        label: copy.upgradeUnavailableLabel,
        ariaLabel: copy.upgradeUnavailableAriaLabel,
        disabled: true,
      };
    }

    return {
      label: isStarting ? dashboardCopy.billing.startingLabel : actionLabel,
      ariaLabel: actionAriaLabel,
      disabled: isStarting,
      onClick: () => {
        handleUpgrade(tier);
      },
    };
  };

  const freeAction = !user
    ? {
        label: copy.signUpLabel,
        ariaLabel: copy.signUpAriaLabel,
        to: getLoginSignupPath(pricingPath),
      }
    : undefined;

  const heading = (
    <Stack spacing={1}>
      <Typography
        variant="overline"
        component="p"
        sx={{ color: "secondary.dark", letterSpacing: "0.16em" }}
      >
        {appName}
      </Typography>
      <Typography id="pricing-heading" variant="h1" component="h1">
        {copy.title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {copy.description}
      </Typography>
    </Stack>
  );

  const body = (
    <Stack spacing={3}>
      {plansQuery.status === "loading" ? (
        <ResourceLoadingState label={copy.loadingLabel} />
      ) : null}
      {plansQuery.status === "error" ? (
        <Stack spacing={2}>
          <StatusCard
            title={copy.unavailableTitle}
            description={getPlansUnavailableMessage(plansQuery.error)}
          />
          <Button
            type="button"
            variant="contained"
            color="primary"
            onClick={handleRetry}
            onKeyDown={handleRetryKeyDown}
            tabIndex={0}
            aria-label={copy.retryAriaLabel}
          >
            {copy.retryLabel}
          </Button>
        </Stack>
      ) : null}
      {plansQuery.status === "ready" ? (
        <Stack spacing={3}>
          {alreadySubscribedMessage ? (
            <Alert severity="info" role="status" aria-live="polite">
              {alreadySubscribedMessage}
            </Alert>
          ) : null}
          {error ? (
            <Alert severity="error" role="alert" aria-live="assertive">
              {error}
            </Alert>
          ) : null}
          {storeManaged ? (
            <Alert severity="info" role="status" aria-live="polite">
              {dashboardCopy.billing.storeManage}
            </Alert>
          ) : null}
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              {copy.intervalHint}
            </Typography>
            <BillingIntervalToggle
              value={billingInterval}
              onChange={handleIntervalChange}
              disabled={isStarting}
            />
          </Stack>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ alignItems: "stretch" }}
          >
            <PricingPlanCard
              name={copy.freeName}
              headingId="pricing-free-heading"
              priceLabel={copy.freePriceLabel}
              features={getFreePlanFeatureLines(entitlement?.limits)}
              isCurrent={currentTier === "free"}
              currentPlanLabel={copy.currentPlanLabel}
              currentPlanAriaLabel={copy.currentPlanAriaLabel}
              action={freeAction}
            />
            <PricingPlanCard
              name={copy.basicName}
              headingId="pricing-basic-heading"
              priceLabel={
                basicPlan
                  ? formatBillingPrice(basicPlan.unitAmount, basicPlan.currency)
                  : copy.upgradeUnavailableLabel
              }
              priceHint={basicPlan ? intervalHint : undefined}
              features={getBasicPlanFeatureLines()}
              isCurrent={currentTier === "basic"}
              currentPlanLabel={copy.currentPlanLabel}
              currentPlanAriaLabel={copy.currentPlanAriaLabel}
              action={getPaidCardAction("basic")}
            />
            <PricingPlanCard
              name={copy.premiumName}
              headingId="pricing-premium-heading"
              priceLabel={
                premiumPlan
                  ? formatBillingPrice(
                      premiumPlan.unitAmount,
                      premiumPlan.currency,
                    )
                  : copy.upgradeUnavailableLabel
              }
              priceHint={premiumPlan ? intervalHint : undefined}
              features={getPremiumPlanFeatureLines()}
              isCurrent={currentTier === "premium"}
              currentPlanLabel={copy.currentPlanLabel}
              currentPlanAriaLabel={copy.currentPlanAriaLabel}
              action={getPaidCardAction("premium")}
            />
          </Stack>
        </Stack>
      ) : null}
    </Stack>
  );

  if (isDashboard) {
    return (
      <DashboardPage
        headingId="pricing-heading"
        title={copy.title}
        description={copy.description}
      >
        {body}
      </DashboardPage>
    );
  }

  return (
    <DashboardThemeProvider>
      <SectionSurface
        component="article"
        variant="mist"
        aria-labelledby="pricing-heading"
        sx={{
          py: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="lg">
          <DashboardPaper>
            <Stack spacing={4}>
              {heading}
              {body}
            </Stack>
          </DashboardPaper>
        </Container>
      </SectionSurface>
    </DashboardThemeProvider>
  );
};
