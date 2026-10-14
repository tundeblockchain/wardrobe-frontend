import type { KeyboardEvent } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  canStartWebCheckout,
  isStoreManagedPaidTier,
  isStripeBasicPaidTier,
  type CheckoutTier,
} from "../../api/billing";
import type { PaidTier } from "../../api/resourceTypes";
import { dashboardCopy } from "../../content/dashboardCopy";
import {
  useCheckoutAction,
  type CheckoutGetMeFn,
  type StartCheckoutFn,
} from "../../hooks/useCheckoutAction";
import { appPaths } from "../../routes/paths";

export type CheckoutUpgradeActionProps = {
  checkoutTier: CheckoutTier;
  paidTier?: PaidTier | null;
  actionLabel: string;
  actionAriaLabel: string;
  startCheckout?: StartCheckoutFn;
  getMe?: CheckoutGetMeFn;
  assignLocation?: (url: string) => void;
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
}: CheckoutUpgradeActionProps) => {
  const {
    isStarting,
    error,
    alreadySubscribedMessage,
    existingPaidTier,
    handleCheckout,
  } = useCheckoutAction({ startCheckout, getMe, assignLocation });

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
    void handleCheckout(checkoutTier);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleClick();
  };

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
      <Button
        type="button"
        variant="contained"
        color="primary"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label={actionAriaLabel}
        disabled={isStarting}
      >
        {isStarting ? copy.startingLabel : actionLabel}
      </Button>
    </Stack>
  );
};
