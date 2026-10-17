import { describe, expect, it } from "vitest";
import { MOCK_BILLING_PLANS, formatBillingPrice } from "../api/billingPlans";
import {
  appendUpgradePriceLabel,
  formatUpgradePriceSuffix,
  getUpgradePriceLabel,
} from "./upgradePriceLabel";

describe("upgrade price label", () => {
  it("formats monthly and yearly prices from catalog amounts and currency", () => {
    expect(formatUpgradePriceSuffix(1500, "gbp", "monthly")).toBe(
      `${formatBillingPrice(1500, "gbp")}/month`,
    );
    expect(formatUpgradePriceSuffix(15000, "gbp", "yearly")).toBe(
      `${formatBillingPrice(15000, "gbp")}/year`,
    );
    expect(formatUpgradePriceSuffix(500, "jpy", "monthly")).toBe(
      `${formatBillingPrice(500, "jpy")}/month`,
    );
  });

  it("appends the live price to an upgrade label and keeps the base label without a price", () => {
    const monthlyPrice = formatUpgradePriceSuffix(1500, "gbp", "monthly");

    expect(
      appendUpgradePriceLabel("Upgrade to Premium", monthlyPrice),
    ).toBe(`Upgrade to Premium, ${monthlyPrice}`);
    expect(appendUpgradePriceLabel("Upgrade to Premium", undefined)).toBe(
      "Upgrade to Premium",
    );
  });

  it("resolves Basic and Premium labels from GET /billing/plans rows", () => {
    expect(
      getUpgradePriceLabel({
        actionLabel: "Upgrade to Premium",
        plans: MOCK_BILLING_PLANS,
        tier: "premium",
        interval: "monthly",
      }),
    ).toBe(
      `Upgrade to Premium, ${formatUpgradePriceSuffix(1500, "gbp", "monthly")}`,
    );
    expect(
      getUpgradePriceLabel({
        actionLabel: "Upgrade to Basic",
        plans: MOCK_BILLING_PLANS,
        tier: "basic",
        interval: "yearly",
      }),
    ).toBe(
      `Upgrade to Basic, ${formatUpgradePriceSuffix(5000, "gbp", "yearly")}`,
    );
  });

  it("falls back to the base label when plans are missing or the selected row is absent", () => {
    expect(
      getUpgradePriceLabel({
        actionLabel: "Upgrade to Premium",
        plans: undefined,
        tier: "premium",
        interval: "monthly",
      }),
    ).toBe("Upgrade to Premium");
    expect(
      getUpgradePriceLabel({
        actionLabel: "Upgrade to Premium",
        plans: MOCK_BILLING_PLANS.filter((plan) => plan.interval === "monthly"),
        tier: "premium",
        interval: "yearly",
      }),
    ).toBe("Upgrade to Premium");
  });
});
