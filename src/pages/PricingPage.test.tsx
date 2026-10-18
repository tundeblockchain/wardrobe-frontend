import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ALREADY_SUBSCRIBED_CODE } from "../api/billing";
import { ApiError } from "../api/httpClient";
import {
  formatBillingPrice,
  MOCK_BILLING_PLANS,
  PLANS_UNAVAILABLE_CODE,
  PLANS_UNAVAILABLE_MESSAGE,
  type BillingPlansResponse,
} from "../api/billingPlans";
import { mockFreeAtLimitEntitlement } from "../api/mockResourceApi";
import {
  DASHBOARD_PAPER_LIGHT_EMPHASIS_SHADOW,
  DASHBOARD_PAPER_LIGHT_SHADOW,
} from "../components/dashboard/DashboardPaper";
import { PRICING_PLAN_CARD_TEST_ID } from "../components/pricing/PricingPlanCard";
import {
  alreadySubscribedCopy,
  getStripeAlreadySubscribedMessage,
} from "../content/alreadySubscribed";
import { pricingCopy } from "../content/pricingCopy";
import { appPaths, getLoginPath, getLoginSignupPath } from "../routes/paths";
import { renderWithProviders } from "../test/renderWithProviders";
import type {
  CheckoutGetMeFn,
  StartCheckoutFn,
  StartPortalFn,
} from "../hooks/useCheckoutAction";
import { DashboardThemeProvider } from "../theme/DashboardThemeProvider";
import { PricingPage } from "./PricingPage";

const RouteLocation = () => {
  const location = useLocation();
  return (
    <div data-testid="route-location">{`${location.pathname}${location.search}${location.hash}`}</div>
  );
};

const LoginRoute = () => {
  return <p>Sign in page</p>;
};

const pendingPlans = (): Promise<BillingPlansResponse> => {
  return new Promise(() => undefined);
};

const renderPricing = ({
  route = appPaths.pricing,
  user,
  fetchPlans = async () => ({ plans: MOCK_BILLING_PLANS }),
  startCheckout,
  startPortal,
  getMe,
  assignLocation,
}: {
  route?: string;
  user?: { id: string } | null;
  fetchPlans?: () => Promise<BillingPlansResponse>;
  startCheckout?: StartCheckoutFn;
  startPortal?: StartPortalFn;
  getMe?: CheckoutGetMeFn;
  assignLocation?: (url: string) => void;
} = {}) => {
  return renderWithProviders(
    <DashboardThemeProvider>
      <Routes>
        <Route
          path={appPaths.pricing}
          element={
            <PricingPage
              fetchPlans={fetchPlans}
              startCheckout={startCheckout}
              startPortal={startPortal}
              getMe={getMe}
              assignLocation={assignLocation}
            />
          }
        />
        <Route
          path={appPaths.appPricing}
          element={
            <PricingPage
              fetchPlans={fetchPlans}
              startCheckout={startCheckout}
              startPortal={startPortal}
              getMe={getMe}
              assignLocation={assignLocation}
            />
          }
        />
        <Route path={appPaths.login} element={<LoginRoute />} />
      </Routes>
      <RouteLocation />
    </DashboardThemeProvider>,
    {
      route,
      auth: { user: user ?? null, loading: false },
    },
  );
};

const getPlanCard = (name: string) => {
  const heading = screen.getByRole("heading", { level: 2, name });
  const card = heading.closest(`[data-testid="${PRICING_PLAN_CARD_TEST_ID}"]`);
  if (!(card instanceof HTMLElement)) {
    throw new Error(`Missing ${name} plan card`);
  }

  return card;
};

describe("PricingPage", () => {
  it("shows a loading status while the public catalog is in flight", () => {
    renderPricing({ fetchPlans: pendingPlans });

    expect(
      screen.getByRole("heading", { level: 1, name: "Pricing" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: pricingCopy.loadingLabel }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: "Free" }),
    ).not.toBeInTheDocument();
  });

  it("renders Free, Basic, and Premium with live catalog prices", async () => {
    renderPricing();

    expect(
      await screen.findByRole("heading", { level: 2, name: "Free" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Basic" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Premium" }),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Free")).getByRole("heading", { name: "Free" }),
    ).toBeInTheDocument();
    expect(within(getPlanCard("Free")).getAllByText("Free").length).toBeGreaterThan(
      1,
    );
    expect(
      within(getPlanCard("Basic")).getByText(
        formatBillingPrice(500, "gbp"),
      ),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Premium")).getByText(
        formatBillingPrice(1500, "gbp"),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bill monthly" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      within(getPlanCard("Free")).getByText("1 wardrobe, 5 items, 5 outfits"),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Free")).getByLabelText("Virtual Try On not included"),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Free")).getByLabelText(
        "Virtual Profile not included",
      ),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Free")).getByLabelText(
        "Outfit suggestions not included",
      ),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Basic")).getByText(
        "Unlimited wardrobes, items, and outfits plus Outfit suggestions",
      ),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Basic")).getByLabelText("Unlimited wardrobes included"),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Basic")).getByLabelText("Unlimited items included"),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Basic")).getByLabelText("Unlimited outfits included"),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Basic")).getByLabelText(
        "Outfit suggestions included",
      ),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Basic")).getByLabelText(
        "Virtual Try On not included",
      ),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Basic")).getByLabelText(
        "Virtual Profile not included",
      ),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Premium")).getByText(
        "Unlimited wardrobes, items, and outfits plus Virtual Try On, Virtual Profile, and Outfit suggestions",
      ),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Premium")).getByLabelText(
        "Unlimited wardrobes included",
      ),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Premium")).getByLabelText("Unlimited items included"),
    ).toBeInTheDocument();
    expect(getPlanCard("Basic").textContent).not.toContain("Unlimited catalog");
    expect(getPlanCard("Premium").textContent).not.toContain(
      "Unlimited catalog",
    );
    expect(
      within(getPlanCard("Premium")).getByLabelText("Virtual Try On included"),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Premium")).getByLabelText(
        "Virtual Profile included",
      ),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Premium")).getByLabelText(
        "Outfit suggestions included",
      ),
    ).toBeInTheDocument();
    expect(getPlanCard("Free").textContent).not.toMatch(/\bAI\b/);
    expect(getPlanCard("Basic").textContent).not.toMatch(/\bAI\b/);
    expect(getPlanCard("Premium").textContent).not.toMatch(/\bAI\b/);
  });

  it("toggles monthly and yearly catalog prices", async () => {
    const user = userEvent.setup();
    renderPricing();

    expect(
      await screen.findByText(formatBillingPrice(500, "gbp")),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bill yearly" }));

    expect(screen.getByRole("button", { name: "Bill yearly" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      within(getPlanCard("Basic")).getByText(
        formatBillingPrice(5000, "gbp"),
      ),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Premium")).getByText(
        formatBillingPrice(15000, "gbp"),
      ),
    ).toBeInTheDocument();
  });

  it("shows a friendly 503 state and retries the catalog", async () => {
    const user = userEvent.setup();
    const fetchPlans = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({
          status: 503,
          code: PLANS_UNAVAILABLE_CODE,
          message: PLANS_UNAVAILABLE_MESSAGE,
        }),
      )
      .mockResolvedValueOnce({ plans: MOCK_BILLING_PLANS });

    renderPricing({ fetchPlans });

    expect(
      await screen.findByRole("heading", { name: "Plans unavailable" }),
    ).toBeInTheDocument();
    expect(screen.getByText(PLANS_UNAVAILABLE_MESSAGE)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: "Basic" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry loading billing plans" }));

    expect(
      await screen.findByRole("heading", { level: 2, name: "Basic" }),
    ).toBeInTheDocument();
    expect(fetchPlans).toHaveBeenCalledTimes(2);
  });

  it("highlights the current plan for a signed-in Free user", async () => {
    renderPricing({
      user: { id: "user-1" },
      getMe: vi.fn().mockResolvedValue(mockFreeAtLimitEntitlement),
    });

    expect(
      await screen.findByRole("heading", { level: 2, name: "Free" }),
    ).toBeInTheDocument();
    expect(getPlanCard("Free")).toHaveAttribute("aria-current", "true");
    expect(
      within(getPlanCard("Free")).getByLabelText("Current plan"),
    ).toBeInTheDocument();
    expect(getPlanCard("Basic")).not.toHaveAttribute("aria-current");
    expect(
      within(getPlanCard("Free")).getByText("1 wardrobe, 5 items, 5 outfits"),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Free")).queryByRole("button"),
    ).not.toBeInTheDocument();
    expect(
      within(getPlanCard("Free")).queryByRole("link"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upgrade to Basic" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upgrade to Premium" }),
    ).toBeInTheDocument();
    expect(getPlanCard("Free")).toHaveStyle({
      boxShadow: DASHBOARD_PAPER_LIGHT_EMPHASIS_SHADOW,
    });
    expect(getPlanCard("Basic")).toHaveStyle({
      boxShadow: DASHBOARD_PAPER_LIGHT_SHADOW,
    });
    expect(getPlanCard("Free").textContent).not.toMatch(/\bAI\b/);
  });

  it("highlights Basic when GET /me says the signed-in user is on Basic", async () => {
    renderPricing({
      user: { id: "user-1" },
      getMe: vi.fn().mockResolvedValue({
        paidTier: { tier: "basic", source: "stripe" },
      }),
    });

    expect(
      await screen.findByRole("heading", { level: 2, name: "Basic" }),
    ).toBeInTheDocument();
    expect(getPlanCard("Basic")).toHaveAttribute("aria-current", "true");
    expect(
      within(getPlanCard("Basic")).queryByRole("button", {
        name: "Upgrade to Basic",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(getPlanCard("Free")).queryByRole("button"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Choose plan" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upgrade to Premium" }),
    ).toBeInTheDocument();
    expect(getPlanCard("Basic")).toHaveStyle({
      boxShadow: DASHBOARD_PAPER_LIGHT_EMPHASIS_SHADOW,
    });
    expect(getPlanCard("Premium")).toHaveStyle({
      boxShadow: DASHBOARD_PAPER_LIGHT_SHADOW,
    });
  });

  it("starts checkout with the selected tier and interval", async () => {
    const user = userEvent.setup();
    const startCheckout = vi.fn().mockResolvedValue({
      url: "https://checkout.example.test/session/cs_from_server",
    });
    const assignLocation = vi.fn();

    renderPricing({
      user: { id: "user-1" },
      getMe: vi.fn().mockResolvedValue({ paidTier: null }),
      startCheckout,
      assignLocation,
    });

    expect(
      await screen.findByRole("button", { name: "Upgrade to Basic" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Upgrade to Basic" }));

    await waitFor(() => {
      expect(startCheckout).toHaveBeenCalledWith("basic", "monthly");
      expect(assignLocation).toHaveBeenCalledWith(
        "https://checkout.example.test/session/cs_from_server",
      );
    });

    await user.click(screen.getByRole("button", { name: "Bill yearly" }));
    await user.click(screen.getByRole("button", { name: "Upgrade to Premium" }));

    await waitFor(() => {
      expect(startCheckout).toHaveBeenCalledWith("premium", "yearly");
    });
  });

  it("links a Stripe already-subscribed banner to Settings", async () => {
    const user = userEvent.setup();
    const startCheckout = vi.fn().mockRejectedValue(
      new ApiError({
        status: 409,
        code: ALREADY_SUBSCRIBED_CODE,
        source: "stripe",
      }),
    );
    const assignLocation = vi.fn();

    renderPricing({
      user: { id: "user-1" },
      getMe: vi.fn().mockResolvedValue({
        paidTier: { tier: "basic", source: "stripe" },
      }),
      startCheckout,
      assignLocation,
    });

    await user.click(
      await screen.findByRole("button", { name: "Upgrade to Premium" }),
    );

    const banner = await screen.findByRole("status", {
      name: getStripeAlreadySubscribedMessage(),
    });
    expect(banner).toHaveTextContent(getStripeAlreadySubscribedMessage());
    expect(
      within(banner).getByRole("link", {
        name: alreadySubscribedCopy.stripeLink,
      }),
    ).toHaveAttribute("href", appPaths.appSettings);
    expect(assignLocation).not.toHaveBeenCalled();
  });

  it("sends a signed-out upgrade to sign in and keeps a sign-up path back to pricing", async () => {
    const user = userEvent.setup();
    const startCheckout = vi.fn();

    renderPricing({ startCheckout });

    expect(
      await screen.findByRole("button", {
        name: "Sign in or sign up to upgrade to Basic",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Sign in or sign up to upgrade to Premium",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Sign up to get started" }),
    ).toHaveAttribute("href", getLoginSignupPath(appPaths.pricing));

    await user.click(
      screen.getByRole("button", {
        name: "Sign in or sign up to upgrade to Basic",
      }),
    );

    expect(await screen.findByText("Sign in page")).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      getLoginPath(appPaths.pricing),
    );
    expect(startCheckout).not.toHaveBeenCalled();
  });

  it("disables Upgrade when that tier and interval are missing from the catalog", async () => {
    renderPricing({
      user: { id: "user-1" },
      getMe: vi.fn().mockResolvedValue({ paidTier: null }),
      fetchPlans: async () => ({
        plans: MOCK_BILLING_PLANS.filter(
          (plan) => !(plan.tier === "premium" && plan.interval === "monthly"),
        ),
      }),
    });

    expect(
      await screen.findByRole("button", { name: "Upgrade to Basic" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", {
        name: "Upgrade unavailable for this plan",
      }),
    ).toBeDisabled();
  });

  it("uses the in-app dashboard heading on /app/pricing", async () => {
    renderPricing({
      route: appPaths.appPricing,
      user: { id: "user-1" },
      getMe: vi.fn().mockResolvedValue({ paidTier: null }),
    });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Pricing" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-page-container")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { level: 2, name: "Free" }),
    ).toBeInTheDocument();
  });

  it("opens the Stripe portal from Choose plan for a Premium user on Basic", async () => {
    const user = userEvent.setup();
    const startCheckout = vi.fn();
    const startPortal = vi.fn().mockResolvedValue({
      url: "https://billing.example.test/session/portal",
    });
    const assignLocation = vi.fn();

    renderPricing({
      user: { id: "user-1" },
      getMe: vi.fn().mockResolvedValue({
        paidTier: { tier: "premium", source: "stripe" },
      }),
      startCheckout,
      startPortal,
      assignLocation,
    });

    expect(
      await screen.findByRole("heading", { level: 2, name: "Premium" }),
    ).toBeInTheDocument();
    expect(getPlanCard("Premium")).toHaveAttribute("aria-current", "true");
    expect(
      within(getPlanCard("Premium")).getByLabelText("Current plan"),
    ).toBeInTheDocument();
    expect(
      within(getPlanCard("Free")).queryByRole("button"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upgrade to Basic" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upgrade to Premium" }),
    ).not.toBeInTheDocument();
    expect(getPlanCard("Premium")).toHaveStyle({
      boxShadow: DASHBOARD_PAPER_LIGHT_EMPHASIS_SHADOW,
    });
    expect(getPlanCard("Basic")).toHaveStyle({
      boxShadow: DASHBOARD_PAPER_LIGHT_SHADOW,
    });

    await user.click(screen.getByRole("button", { name: "Choose plan" }));

    await waitFor(() => {
      expect(startPortal).toHaveBeenCalledTimes(1);
      expect(assignLocation).toHaveBeenCalledWith(
        "https://billing.example.test/session/portal",
      );
    });
    expect(startCheckout).not.toHaveBeenCalled();
  });

  it("opens the portal from Choose plan on in-app /app/pricing for Premium", async () => {
    const user = userEvent.setup();
    const startCheckout = vi.fn();
    const startPortal = vi.fn().mockResolvedValue({
      url: "https://billing.example.test/session/portal-app",
    });
    const assignLocation = vi.fn();

    renderPricing({
      route: appPaths.appPricing,
      user: { id: "user-1" },
      getMe: vi.fn().mockResolvedValue({
        paidTier: { tier: "premium", source: "stripe" },
      }),
      startCheckout,
      startPortal,
      assignLocation,
    });

    expect(
      await screen.findByRole("button", { name: "Choose plan" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Choose plan" }));

    await waitFor(() => {
      expect(startPortal).toHaveBeenCalledTimes(1);
      expect(assignLocation).toHaveBeenCalledWith(
        "https://billing.example.test/session/portal-app",
      );
    });
    expect(startCheckout).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Upgrade to Basic" }),
    ).not.toBeInTheDocument();
  });

  it("hides Choose plan for a store-managed Premium user", async () => {
    renderPricing({
      user: { id: "user-1" },
      getMe: vi.fn().mockResolvedValue({
        paidTier: { tier: "premium", source: "ios" },
      }),
    });

    expect(
      await screen.findByRole("heading", { level: 2, name: "Premium" }),
    ).toBeInTheDocument();
    expect(getPlanCard("Premium")).toHaveAttribute("aria-current", "true");
    expect(
      screen.queryByRole("button", { name: "Choose plan" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upgrade to Basic" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upgrade to Premium" }),
    ).not.toBeInTheDocument();
  });
});
