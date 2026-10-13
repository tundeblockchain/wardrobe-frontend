import type {
  CatalogKind,
  EntitlementLimits,
  EntitlementUsage,
} from "../../api/resourceTypes";
import { getCatalogLimitDescription } from "../../content/catalogLimitCopy";
import { dashboardCopy } from "../../content/dashboardCopy";
import { appPaths } from "../../routes/paths";
import { ResourceUpgradeState } from "./ResourceUpgradeState";

export type CatalogLimitPromptProps = {
  kind: CatalogKind;
  limits?: EntitlementLimits | null;
  usage?: EntitlementUsage;
};

export const CatalogLimitPrompt = ({
  kind,
  limits,
  usage,
}: CatalogLimitPromptProps) => {
  const copy = dashboardCopy.catalogLimit[kind];

  return (
    <ResourceUpgradeState
      title={copy.title}
      description={getCatalogLimitDescription(kind, { limits, usage })}
      actionLabel={copy.actionLabel}
      actionTo={appPaths.appPlan}
      actionAriaLabel={copy.actionAriaLabel}
    />
  );
};
