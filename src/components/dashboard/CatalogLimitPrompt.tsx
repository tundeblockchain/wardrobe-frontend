import type {
  CatalogKind,
  Entitlement,
  EntitlementLimits,
  EntitlementUsage,
} from "../../api/resourceTypes";
import type { FetchBillingPlansFn } from "../../api/billingPlans";
import type { CheckoutGetMeFn, StartCheckoutFn } from "../../hooks/useCheckoutAction";
import { getCatalogLimitDescription } from "../../content/catalogLimitCopy";
import { dashboardCopy } from "../../content/dashboardCopy";
import { StatusCard } from "../StatusCard";
import { CheckoutUpgradeAction } from "../billing/CheckoutUpgradeAction";
import { DashboardNarrowContent } from "./DashboardNarrowContent";

export type CatalogLimitPromptProps = {
  kind: CatalogKind;
  limits?: EntitlementLimits | null;
  usage?: EntitlementUsage;
  entitlement?: Entitlement | null;
  startCheckout?: StartCheckoutFn;
  getMe?: CheckoutGetMeFn;
  assignLocation?: (url: string) => void;
  fetchPlans?: FetchBillingPlansFn;
};

export const CatalogLimitPrompt = ({
  kind,
  limits,
  usage,
  entitlement,
  startCheckout,
  getMe,
  assignLocation,
  fetchPlans,
}: CatalogLimitPromptProps) => {
  const copy = dashboardCopy.catalogLimit[kind];

  return (
    <DashboardNarrowContent>
      <StatusCard
        title={copy.title}
        description={getCatalogLimitDescription(kind, { limits, usage })}
      />
      <CheckoutUpgradeAction
        checkoutTier="basic"
        paidTier={entitlement?.paidTier}
        actionLabel={copy.actionLabel}
        actionAriaLabel={copy.actionAriaLabel}
        startCheckout={startCheckout}
        getMe={getMe}
        assignLocation={assignLocation}
        fetchPlans={fetchPlans}
      />
    </DashboardNarrowContent>
  );
};
