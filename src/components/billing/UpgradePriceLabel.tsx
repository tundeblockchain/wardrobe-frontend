import { Typography } from "@mui/material";
import type { BillingInterval } from "../../api/billing";
import type { FetchBillingPlansFn } from "../../api/billingPlans";
import type { PaidPlanTier } from "../../api/resourceTypes";
import { useUpgradePriceLabel } from "../../hooks/useUpgradePriceLabel";

export type UpgradePriceLabelProps = {
  actionLabel: string;
  checkoutTier: PaidPlanTier;
  billingInterval: BillingInterval;
  fetchPlans?: FetchBillingPlansFn;
  component?: "span" | "p";
};

export const UpgradePriceLabel = ({
  actionLabel,
  checkoutTier,
  billingInterval,
  fetchPlans,
  component = "span",
}: UpgradePriceLabelProps) => {
  const label = useUpgradePriceLabel({
    actionLabel,
    checkoutTier,
    billingInterval,
    fetchPlans,
  });

  return (
    <Typography component={component} variant="inherit" color="inherit">
      {label}
    </Typography>
  );
};
