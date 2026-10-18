import { describe, expect, it } from "vitest";
import { dashboardCopy } from "./dashboardCopy";

const SUGGESTION_CAP_COPY_PATTERN =
  /up to\s+\d+|\d+\s+per\s+(day|week|month)|suggestion cap|\d+\s+(outfit suggestions|suggested outfits)/i;

describe("dashboard plan copy", () => {
  it("says unlimited for Basic and Premium on the suggested outfits gate", () => {
    const copy = [
      dashboardCopy.recommendations.upgradeTitle,
      dashboardCopy.recommendations.upgradeDescription,
      dashboardCopy.recommendations.upgradeActionAriaLabel,
      dashboardCopy.settings.planIncludesLabel,
    ].join("\n");

    expect(dashboardCopy.recommendations.upgradeDescription).toBe(
      "Upgrade to Basic or Premium for unlimited suggested outfits from clothing items you already own.",
    );
    expect(copy).toContain("unlimited suggested outfits");
    expect(copy).not.toMatch(/\bAI\b/);
    expect(copy).not.toMatch(SUGGESTION_CAP_COPY_PATTERN);
  });
});
