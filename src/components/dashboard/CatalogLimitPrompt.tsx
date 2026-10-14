import { Stack } from "@mui/material";
import type {
  CatalogKind,
  Entitlement,
  EntitlementLimits,
  EntitlementUsage,
} from "../../api/resourceTypes";
import type { CheckoutGetMeFn, StartCheckoutFn } from "../../hooks/useCheckoutAction";
import { getCatalogLimitDescription } from "../../content/catalogLimitCopy";
import { dashboardCopy } from "../../content/dashboardCopy";
import { StatusCard } from "../StatusCard";
import { CheckoutUpgradeAction } from "../billing/CheckoutUpgradeAction";

export type CatalogLimitPromptProps = {
  kind: CatalogKind;
  limits?: EntitlementLimits | null;
  usage?: EntitlementUsage;
  entitlement?: Entitlement | null;
  startCheckout?: StartCheckoutFn;
  getMe?: CheckoutGetMeFn;
  assignLocation?: (url: string) => void;
};

export const CatalogLimitPrompt = ({
  kind,
  limits,
  usage,
  entitlement,
  startCheckout,
  getMe,
  assignLocation,
}: CatalogLimitPromptProps) => {
  const copy = dashboardCopy.catalogLimit[kind];

  return (
    <Stack spacing={2}>
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
      />
    </Stack>
  );
};
