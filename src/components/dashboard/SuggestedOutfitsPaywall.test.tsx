import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dashboardCopy } from "../../content/dashboardCopy";
import { appPaths } from "../../routes/paths";
import {
  expectActionButtonNotFullWidth,
  expectInsideNarrowContent,
} from "../../test/dashboardNarrowContentTest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { SuggestedOutfitsPaywall } from "./SuggestedOutfitsPaywall";

describe("SuggestedOutfitsPaywall", () => {
  it("locks Free behind a Basic upgrade CTA without AI copy", () => {
    renderWithProviders(<SuggestedOutfitsPaywall />, {
      auth: { user: { id: "user-1" } },
    });

    expectInsideNarrowContent(
      screen.getByRole("heading", {
        name: dashboardCopy.recommendations.upgradeTitle,
      }),
    );
    expect(
      screen.getByText(dashboardCopy.recommendations.upgradeDescription),
    ).toBeInTheDocument();
    expectActionButtonNotFullWidth(
      screen.getByRole("button", {
        name: dashboardCopy.recommendations.upgradeActionAriaLabel,
      }),
    );
    expect(
      screen.getByRole("link", {
        name: dashboardCopy.billing.comparePlansAriaLabel,
      }),
    ).toHaveAttribute("href", appPaths.appPricing);

    const copy = [
      dashboardCopy.recommendations.upgradeTitle,
      dashboardCopy.recommendations.upgradeDescription,
      dashboardCopy.recommendations.upgradeActionAriaLabel,
    ].join("\n");
    expect(copy).toContain("unlimited suggested outfits");
    expect(copy).not.toMatch(/Premium.*unlimited|unlimited.*Premium/i);
    expect(copy).not.toMatch(/\bAI\b/);
    expect(copy).not.toMatch(
      /up to\s+\d+|\d+\s+per\s+(day|week|month)|suggestion cap/i,
    );
  });
});
