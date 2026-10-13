import type { CatalogKind } from "../../api/resourceTypes";
import { dashboardCopy } from "../../content/dashboardCopy";
import { appPaths } from "../../routes/paths";
import { ResourceUpgradeState } from "./ResourceUpgradeState";

export type CatalogLimitPromptProps = {
  kind: CatalogKind;
};

export const CatalogLimitPrompt = ({ kind }: CatalogLimitPromptProps) => {
  const copy = dashboardCopy.catalogLimit[kind];

  return (
    <ResourceUpgradeState
      title={copy.title}
      description={copy.description}
      actionLabel={copy.actionLabel}
      actionTo={appPaths.appPlan}
      actionAriaLabel={copy.actionAriaLabel}
    />
  );
};
