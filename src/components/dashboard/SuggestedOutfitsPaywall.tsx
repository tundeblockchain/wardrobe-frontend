import { dashboardCopy } from "../../content/dashboardCopy";
import {
  ForbiddenUpgradePrompt,
  type ForbiddenUpgradePromptProps,
} from "./ForbiddenUpgradePrompt";

export type SuggestedOutfitsPaywallProps = Omit<
  ForbiddenUpgradePromptProps,
  | "kind"
  | "catalogKind"
  | "basicTitle"
  | "basicDescription"
  | "basicActionAriaLabel"
  | "showComparePlans"
>;

export const SuggestedOutfitsPaywall = (
  props: SuggestedOutfitsPaywallProps,
) => {
  const copy = dashboardCopy.recommendations;

  return (
    <ForbiddenUpgradePrompt
      {...props}
      kind="basic"
      basicTitle={copy.upgradeTitle}
      basicDescription={copy.upgradeDescription}
      basicActionAriaLabel={copy.upgradeActionAriaLabel}
      showComparePlans
    />
  );
};
