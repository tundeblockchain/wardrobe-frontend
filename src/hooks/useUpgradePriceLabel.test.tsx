import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApiError } from "../api/httpClient";
import {
  MOCK_BILLING_PLANS,
  PLANS_UNAVAILABLE_CODE,
  PLANS_UNAVAILABLE_MESSAGE,
  type BillingPlansResponse,
} from "../api/billingPlans";
import { getUpgradePriceLabel } from "../content/upgradePriceLabel";
import { renderWithProviders } from "../test/renderWithProviders";
import { useUpgradePriceLabel } from "./useUpgradePriceLabel";

const PriceProbe = ({
  interval,
  fetchPlans,
}: {
  interval: "monthly" | "yearly";
  fetchPlans: () => Promise<BillingPlansResponse>;
}) => {
  const label = useUpgradePriceLabel({
    actionLabel: "Upgrade to Premium",
    checkoutTier: "premium",
    billingInterval: interval,
    fetchPlans,
  });

  return <p>{label}</p>;
};

describe("useUpgradePriceLabel", () => {
  it("returns monthly and yearly labels from GET /billing/plans", async () => {
    const loadMockPlans = async (): Promise<BillingPlansResponse> => {
      return { plans: MOCK_BILLING_PLANS };
    };

    const { unmount } = renderWithProviders(
      <PriceProbe interval="monthly" fetchPlans={loadMockPlans} />,
    );

    expect(
      await screen.findByText(
        getUpgradePriceLabel({
          actionLabel: "Upgrade to Premium",
          plans: MOCK_BILLING_PLANS,
          tier: "premium",
          interval: "monthly",
        }),
      ),
    ).toBeInTheDocument();
    unmount();

    renderWithProviders(
      <PriceProbe interval="yearly" fetchPlans={loadMockPlans} />,
    );

    expect(
      await screen.findByText(
        getUpgradePriceLabel({
          actionLabel: "Upgrade to Premium",
          plans: MOCK_BILLING_PLANS,
          tier: "premium",
          interval: "yearly",
        }),
      ),
    ).toBeInTheDocument();
  });

  it("returns the base label on 503 PLANS_UNAVAILABLE", async () => {
    renderWithProviders(
      <PriceProbe
        interval="monthly"
        fetchPlans={async () => {
          throw new ApiError({
            status: 503,
            code: PLANS_UNAVAILABLE_CODE,
            message: PLANS_UNAVAILABLE_MESSAGE,
          });
        }}
      />,
    );

    expect(await screen.findByText("Upgrade to Premium")).toBeInTheDocument();
    expect(screen.queryByText(/\/month/)).not.toBeInTheDocument();
  });
});
