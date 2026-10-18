import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/httpClient";
import {
  MOCK_BILLING_PLANS,
  PLANS_UNAVAILABLE_CODE,
  PLANS_UNAVAILABLE_MESSAGE,
  type BillingPlansResponse,
} from "../../api/billingPlans";
import { dashboardCopy } from "../../content/dashboardCopy";
import { getUpgradePriceLabel } from "../../content/upgradePriceLabel";
import { renderWithProviders } from "../../test/renderWithProviders";
import { CatalogLimitPrompt } from "../dashboard/CatalogLimitPrompt";
import { ForbiddenUpgradePrompt } from "../dashboard/ForbiddenUpgradePrompt";
import { SuggestedOutfitsPaywall } from "../dashboard/SuggestedOutfitsPaywall";
import { UpgradePriceLabel } from "./UpgradePriceLabel";

const loadMockPlans = async (): Promise<BillingPlansResponse> => {
  return { plans: MOCK_BILLING_PLANS };
};

const pendingPlans = (): Promise<BillingPlansResponse> => {
  return new Promise(() => undefined);
};

const rejectPlansUnavailable = async (): Promise<BillingPlansResponse> => {
  throw new ApiError({
    status: 503,
    code: PLANS_UNAVAILABLE_CODE,
    message: PLANS_UNAVAILABLE_MESSAGE,
  });
};

const premiumMonthlyLabel = (actionLabel: string) => {
  return getUpgradePriceLabel({
    actionLabel,
    plans: MOCK_BILLING_PLANS,
    tier: "premium",
    interval: "monthly",
  });
};

const premiumYearlyLabel = (actionLabel: string) => {
  return getUpgradePriceLabel({
    actionLabel,
    plans: MOCK_BILLING_PLANS,
    tier: "premium",
    interval: "yearly",
  });
};

const basicMonthlyLabel = (actionLabel: string) => {
  return getUpgradePriceLabel({
    actionLabel,
    plans: MOCK_BILLING_PLANS,
    tier: "basic",
    interval: "monthly",
  });
};

describe("UpgradePriceLabel", () => {
  it("formats monthly and yearly Premium prices from GET /billing/plans", async () => {
    const { unmount } = renderWithProviders(
      <UpgradePriceLabel
        actionLabel="Upgrade to Premium"
        checkoutTier="premium"
        billingInterval="monthly"
        fetchPlans={loadMockPlans}
      />,
    );

    expect(
      await screen.findByText(premiumMonthlyLabel("Upgrade to Premium")),
    ).toBeInTheDocument();
    unmount();

    renderWithProviders(
      <UpgradePriceLabel
        actionLabel="Upgrade to Premium"
        checkoutTier="premium"
        billingInterval="yearly"
        fetchPlans={loadMockPlans}
      />,
    );

    expect(
      await screen.findByText(premiumYearlyLabel("Upgrade to Premium")),
    ).toBeInTheDocument();
  });

  it("shows the base label while plans load and on 503 PLANS_UNAVAILABLE", async () => {
    const { unmount } = renderWithProviders(
      <UpgradePriceLabel
        actionLabel="Upgrade to Premium"
        checkoutTier="premium"
        billingInterval="monthly"
        fetchPlans={pendingPlans}
      />,
    );

    expect(screen.getByText("Upgrade to Premium")).toBeInTheDocument();
    expect(screen.queryByText(/\/month/)).not.toBeInTheDocument();
    unmount();

    renderWithProviders(
      <UpgradePriceLabel
        actionLabel="Upgrade to Premium"
        checkoutTier="premium"
        billingInterval="monthly"
        fetchPlans={rejectPlansUnavailable}
      />,
    );

    expect(await screen.findByText("Upgrade to Premium")).toBeInTheDocument();
    expect(screen.queryByText(/\/month/)).not.toBeInTheDocument();
  });
});

describe("upgrade price on dashboard gates", () => {
  it("renders the live Premium price on the Virtual Try On lock card", async () => {
    const startCheckout = vi.fn().mockResolvedValue({
      url: "https://checkout.example.test/premium",
    });
    const assignLocation = vi.fn();

    renderWithProviders(
      <ForbiddenUpgradePrompt
        kind="premium"
        fetchPlans={loadMockPlans}
        startCheckout={startCheckout}
        assignLocation={assignLocation}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    const pricedAriaLabel = premiumMonthlyLabel(
      dashboardCopy.upgrade.premium.actionAriaLabel,
    );
    const button = await screen.findByRole("button", { name: pricedAriaLabel });
    expect(button).toHaveTextContent(
      premiumMonthlyLabel(dashboardCopy.upgrade.premium.actionLabel),
    );

    await userEvent.setup().click(button);
    await waitFor(() => {
      expect(startCheckout).toHaveBeenCalledWith("premium", "monthly");
    });
  });

  it("updates the Virtual Try On lock price when yearly billing is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ForbiddenUpgradePrompt kind="premium" fetchPlans={loadMockPlans} />,
      { auth: { user: { id: "user-1" } } },
    );

    await screen.findByRole("button", {
      name: premiumMonthlyLabel(dashboardCopy.upgrade.premium.actionAriaLabel),
    });
    await user.click(screen.getByRole("button", { name: "Bill yearly" }));

    expect(
      await screen.findByRole("button", {
        name: premiumYearlyLabel(
          dashboardCopy.upgrade.premium.actionAriaLabel,
        ),
      }),
    ).toHaveTextContent(
      premiumYearlyLabel(dashboardCopy.upgrade.premium.actionLabel),
    );
  });

  it("renders the live Premium price on the Virtual Profile gate", async () => {
    renderWithProviders(
      <ForbiddenUpgradePrompt
        kind="premium"
        fetchPlans={loadMockPlans}
        premiumTitle={dashboardCopy.virtualProfiles.otherAiTitle}
        premiumDescription={dashboardCopy.virtualProfiles.otherAiDescription}
        premiumActionAriaLabel={
          dashboardCopy.virtualProfiles.otherAiActionAriaLabel
        }
      />,
      { auth: { user: { id: "user-1" } } },
    );

    expect(
      await screen.findByRole("heading", {
        name: "Virtual Profile edits need Premium",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: premiumMonthlyLabel(
          dashboardCopy.virtualProfiles.otherAiActionAriaLabel,
        ),
      }),
    ).toHaveTextContent(
      premiumMonthlyLabel(dashboardCopy.upgrade.premium.actionLabel),
    );
  });

  it("renders the live Basic price on the Outfit suggestions gate", async () => {
    renderWithProviders(
      <SuggestedOutfitsPaywall fetchPlans={loadMockPlans} />,
      { auth: { user: { id: "user-1" } } },
    );

    expect(
      await screen.findByRole("heading", {
        name: "Suggested outfits need a paid plan",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Upgrade to Basic for unlimited suggested outfits from clothing items you already own.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: basicMonthlyLabel(
          dashboardCopy.recommendations.upgradeActionAriaLabel,
        ),
      }),
    ).toHaveTextContent(
      basicMonthlyLabel(dashboardCopy.upgrade.basic.actionLabel),
    );
  });

  it("renders the live Basic price on catalog limit prompts", async () => {
    const { unmount } = renderWithProviders(
      <CatalogLimitPrompt kind="wardrobe" fetchPlans={loadMockPlans} />,
      { auth: { user: { id: "user-1" } } },
    );

    expect(
      await screen.findByRole("button", {
        name: basicMonthlyLabel(
          dashboardCopy.catalogLimit.wardrobe.actionAriaLabel,
        ),
      }),
    ).toHaveTextContent(
      basicMonthlyLabel(dashboardCopy.catalogLimit.wardrobe.actionLabel),
    );
    unmount();

    renderWithProviders(
      <CatalogLimitPrompt kind="outfit" fetchPlans={loadMockPlans} />,
      { auth: { user: { id: "user-1" } } },
    );

    expect(
      await screen.findByRole("button", {
        name: basicMonthlyLabel(
          dashboardCopy.catalogLimit.outfit.actionAriaLabel,
        ),
      }),
    ).toHaveTextContent(
      basicMonthlyLabel(dashboardCopy.catalogLimit.outfit.actionLabel),
    );
  });

  it("keeps upgrade working without a price when plans are unavailable", async () => {
    const user = userEvent.setup();
    const startCheckout = vi.fn().mockResolvedValue({
      url: "https://checkout.example.test/premium",
    });
    const assignLocation = vi.fn();

    renderWithProviders(
      <ForbiddenUpgradePrompt
        kind="premium"
        fetchPlans={rejectPlansUnavailable}
        startCheckout={startCheckout}
        assignLocation={assignLocation}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    const button = await screen.findByRole("button", {
      name: dashboardCopy.upgrade.premium.actionAriaLabel,
    });
    expect(button).toHaveTextContent(
      dashboardCopy.upgrade.premium.actionLabel,
    );
    expect(button).toBeEnabled();

    await user.click(button);
    await waitFor(() => {
      expect(startCheckout).toHaveBeenCalledWith("premium", "monthly");
      expect(assignLocation).toHaveBeenCalledWith(
        "https://checkout.example.test/premium",
      );
    });
  });
});
