import { useState, type KeyboardEvent } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  canStartWebCheckout,
  DEFAULT_BILLING_INTERVAL,
  isStoreManagedPaidTier,
  isStripeBasicPaidTier,
  type BillingInterval,
  type CheckoutTier,
} from "../../api/billing";
import type { FetchBillingPlansFn } from "../../api/billingPlans";
import type { PaidTier } from "../../api/resourceTypes";
import { dashboardCopy } from "../../content/dashboardCopy";
import { getUpgradePriceLabel } from "../../content/upgradePriceLabel";
import { useBillingPlans } from "../../hooks/useBillingPlans";
import {
  useCheckoutAction,
  type CheckoutGetMeFn,
  type StartCheckoutFn,
} from "../../hooks/useCheckoutAction";
import { appPaths } from "../../routes/paths";
import { BillingIntervalToggle } from "./BillingIntervalToggle";

export type CheckoutUpgradeActionProps = {
  checkoutTier: CheckoutTier;
  paidTier?: PaidTier | null;
  actionLabel: string;
  actionAriaLabel: string;
  startCheckout?: StartCheckoutFn;
  getMe?: CheckoutGetMeFn;
  assignLocation?: (url: string) => void;
  fetchPlans?: FetchBillingPlansFn;
};

const copy = dashboardCopy.billing;

export const CheckoutUpgradeAction = ({
  checkoutTier,
  paidTier,
  actionLabel,
  actionAriaLabel,
  startCheckout,
  getMe,
  assignLocation,
  fetchPlans,
}: CheckoutUpgradeActionProps) => {
  const {
    isStarting,
    error,
    alreadySubscribedMessage,
    existingPaidTier,
    handleCheckout,
  } = useCheckoutAction({ startCheckout, getMe, assignLocation });
  const plansQuery = useBillingPlans({ fetchPlans });
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(
    DEFAULT_BILLING_INTERVAL,
  );

  const handleIntervalChange = (nextInterval: BillingInterval) => {
    setBillingInterval(nextInterval);
  };

  const resolvedPaidTier = existingPaidTier ?? paidTier ?? null;

  if (isStoreManagedPaidTier(resolvedPaidTier)) {
    return (
      <Stack spacing={2}>
        {alreadySubscribedMessage ? (
          <Alert severity="info" role="status" aria-live="polite">
            {alreadySubscribedMessage}
          </Alert>
        ) : null}
        <Typography variant="body2" color="text.secondary">
          {copy.storeManage}
        </Typography>
      </Stack>
    );
  }

  if (
    checkoutTier === "premium" &&
    isStripeBasicPaidTier(resolvedPaidTier)
  ) {
    return (
      <Stack spacing={2}>
        {alreadySubscribedMessage ? (
          <Alert severity="info" role="status" aria-live="polite">
            {alreadySubscribedMessage}
          </Alert>
        ) : null}
        <Button
          component={RouterLink}
          to={appPaths.appSettingsPlan}
          variant="contained"
          color="primary"
          tabIndex={0}
          aria-label={copy.stripeBasicManageAriaLabel}
        >
          {copy.stripeBasicManageLabel}
        </Button>
      </Stack>
    );
  }

  if (!canStartWebCheckout(resolvedPaidTier) && resolvedPaidTier) {
    return (
      <Typography variant="body2" color="text.secondary">
        {copy.storeManage}
      </Typography>
    );
  }

  const handleClick = () => {
    void handleCheckout(checkoutTier, billingInterval);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleClick();
  };

  const plans = plansQuery.status === "ready" ? plansQuery.data.plans : undefined;
  const pricedActionLabel = getUpgradePriceLabel({
    actionLabel,
    plans,
    tier: checkoutTier,
    interval: billingInterval,
  });
  const pricedActionAriaLabel = getUpgradePriceLabel({
    actionLabel: actionAriaLabel,
    plans,
    tier: checkoutTier,
    interval: billingInterval,
  });

  return (
    <Stack spacing={2}>
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
      <BillingIntervalToggle
        value={billingInterval}
        onChange={handleIntervalChange}
        disabled={isStarting}
      />
      <Button
        type="button"
        variant="contained"
        color="primary"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label={pricedActionAriaLabel}
        disabled={isStarting}
      >
        {isStarting ? copy.startingLabel : pricedActionLabel}
      </Button>
    </Stack>
  );
};
