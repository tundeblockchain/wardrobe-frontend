import { Stack } from "@mui/material";
import type {
  CatalogKind,
  Entitlement,
  EntitlementLimits,
  EntitlementUsage,
} from "../../api/resourceTypes";
import type { ForbiddenUpgradeKind } from "../../api/entitlementGating";
import type { CheckoutGetMeFn, StartCheckoutFn } from "../../hooks/useCheckoutAction";
import { dashboardCopy } from "../../content/dashboardCopy";
import { StatusCard } from "../StatusCard";
import { CheckoutUpgradeAction } from "../billing/CheckoutUpgradeAction";
import { CatalogLimitPrompt } from "./CatalogLimitPrompt";

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
        />
      );
    }

    return (
      <Stack spacing={2}>
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
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <StatusCard title={premiumTitle} description={premiumDescription} />
      <CheckoutUpgradeAction
        checkoutTier="premium"
        paidTier={entitlement?.paidTier}
        actionLabel={dashboardCopy.upgrade.premium.actionLabel}
        actionAriaLabel={premiumActionAriaLabel}
        startCheckout={startCheckout}
        getMe={getMe}
        assignLocation={assignLocation}
      />
    </Stack>
  );
};
