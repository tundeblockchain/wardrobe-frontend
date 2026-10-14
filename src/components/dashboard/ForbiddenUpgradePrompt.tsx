import type {
  CatalogKind,
  EntitlementLimits,
  EntitlementUsage,
} from "../../api/resourceTypes";
import type { ForbiddenUpgradeKind } from "../../api/entitlementGating";
import { dashboardCopy } from "../../content/dashboardCopy";
import { appPaths } from "../../routes/paths";
import { CatalogLimitPrompt } from "./CatalogLimitPrompt";
import { ResourceUpgradeState } from "./ResourceUpgradeState";

export type ForbiddenUpgradePromptProps = {
  kind: ForbiddenUpgradeKind;
  catalogKind?: CatalogKind;
  limits?: EntitlementLimits | null;
  usage?: EntitlementUsage;
  premiumTitle?: string;
  premiumDescription?: string;
  premiumActionAriaLabel?: string;
};

export const ForbiddenUpgradePrompt = ({
  kind,
  catalogKind,
  limits,
  usage,
  premiumTitle = dashboardCopy.upgrade.premium.title,
  premiumDescription = dashboardCopy.upgrade.premium.description,
  premiumActionAriaLabel = dashboardCopy.upgrade.premium.actionAriaLabel,
}: ForbiddenUpgradePromptProps) => {
  if (kind === "basic") {
    if (catalogKind) {
      return (
        <CatalogLimitPrompt kind={catalogKind} limits={limits} usage={usage} />
      );
    }

    return (
      <ResourceUpgradeState
        title={dashboardCopy.upgrade.basic.title}
        description={dashboardCopy.upgrade.basic.description}
        actionLabel={dashboardCopy.upgrade.basic.actionLabel}
        actionTo={appPaths.appPlan}
        actionAriaLabel={dashboardCopy.upgrade.basic.actionAriaLabel}
      />
    );
  }

  return (
    <ResourceUpgradeState
      title={premiumTitle}
      description={premiumDescription}
      actionLabel={dashboardCopy.upgrade.premium.actionLabel}
      actionTo={appPaths.appPlan}
      actionAriaLabel={premiumActionAriaLabel}
    />
  );
};
