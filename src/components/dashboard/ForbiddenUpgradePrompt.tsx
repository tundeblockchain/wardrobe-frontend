import { Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type {
  CatalogKind,
  Entitlement,
  EntitlementLimits,
  EntitlementUsage,
} from "../../api/resourceTypes";
import type { ForbiddenUpgradeKind } from "../../api/entitlementGating";
import type { FetchBillingPlansFn } from "../../api/billingPlans";
import type { CheckoutGetMeFn, StartCheckoutFn } from "../../hooks/useCheckoutAction";
import { dashboardCopy } from "../../content/dashboardCopy";
import { appPaths } from "../../routes/paths";
import { StatusCard } from "../StatusCard";
import { CheckoutUpgradeAction } from "../billing/CheckoutUpgradeAction";
import { CatalogLimitPrompt } from "./CatalogLimitPrompt";
import { DashboardNarrowContent } from "./DashboardNarrowContent";

export type ForbiddenUpgradePromptProps = {
  kind: ForbiddenUpgradeKind;
  catalogKind?: CatalogKind;
  limits?: EntitlementLimits | null;
  usage?: EntitlementUsage;
  entitlement?: Entitlement | null;
  premiumTitle?: string;
  premiumDescription?: string;
  premiumActionAriaLabel?: string;
  startCheckout?: StartCheckoutFn;
  getMe?: CheckoutGetMeFn;
  assignLocation?: (url: string) => void;
  fetchPlans?: FetchBillingPlansFn;
};

export const ForbiddenUpgradePrompt = ({
  kind,
  catalogKind,
  limits,
  usage,
  entitlement,
  premiumTitle = dashboardCopy.upgrade.premium.title,
  premiumDescription = dashboardCopy.upgrade.premium.description,
  premiumActionAriaLabel = dashboardCopy.upgrade.premium.actionAriaLabel,
  startCheckout,
  getMe,
  assignLocation,
  fetchPlans,
}: ForbiddenUpgradePromptProps) => {
  if (kind === "basic") {
    if (catalogKind) {
      return (
        <CatalogLimitPrompt
          kind={catalogKind}
          limits={limits}
          usage={usage}
          entitlement={entitlement}
          startCheckout={startCheckout}
          getMe={getMe}
          assignLocation={assignLocation}
          fetchPlans={fetchPlans}
        />
      );
    }

    return (
      <DashboardNarrowContent>
        <StatusCard
          title={dashboardCopy.upgrade.basic.title}
          description={dashboardCopy.upgrade.basic.description}
        />
        <CheckoutUpgradeAction
          checkoutTier="basic"
          paidTier={entitlement?.paidTier}
          actionLabel={dashboardCopy.upgrade.basic.actionLabel}
          actionAriaLabel={dashboardCopy.upgrade.basic.actionAriaLabel}
          startCheckout={startCheckout}
          getMe={getMe}
          assignLocation={assignLocation}
          fetchPlans={fetchPlans}
        />
      </DashboardNarrowContent>
    );
  }

  return (
    <DashboardNarrowContent>
      <StatusCard title={premiumTitle} description={premiumDescription} />
      <CheckoutUpgradeAction
        checkoutTier="premium"
        paidTier={entitlement?.paidTier}
        actionLabel={dashboardCopy.upgrade.premium.actionLabel}
        actionAriaLabel={premiumActionAriaLabel}
        startCheckout={startCheckout}
        getMe={getMe}
        assignLocation={assignLocation}
        fetchPlans={fetchPlans}
      />
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
    </DashboardNarrowContent>
  );
};
