import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/httpClient";
import { mockFreeAtLimitEntitlement } from "../../api/mockResourceApi";
import {
  ALREADY_SUBSCRIBED_CODE,
  BILLING_PRICE_NOT_FOUND_CODE,
  YEARLY_BILLING_UNAVAILABLE_MESSAGE,
} from "../../api/billing";
import { appPaths } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ForbiddenUpgradePrompt } from "../dashboard/ForbiddenUpgradePrompt";
import { CatalogLimitPrompt } from "../dashboard/CatalogLimitPrompt";
import { CheckoutUpgradeAction } from "./CheckoutUpgradeAction";

describe("CheckoutUpgradeAction", () => {
  it("starts Basic checkout from a catalog limit 403 and redirects to the server URL", async () => {
    const user = userEvent.setup();
    const startCheckout = vi.fn().mockResolvedValue({
      url: "https://checkout.example.test/basic",
    });
    const assignLocation = vi.fn();

    renderWithProviders(
      <CatalogLimitPrompt
        kind="wardrobe"
        startCheckout={startCheckout}
        assignLocation={assignLocation}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Upgrade to Basic to add more wardrobes",
      }),
    );

    expect(screen.getByRole("button", { name: "Bill monthly" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await waitFor(() => {
      expect(startCheckout).toHaveBeenCalledWith("basic", "monthly");
      expect(assignLocation).toHaveBeenCalledWith(
        "https://checkout.example.test/basic",
      );
    });
    expect(assignLocation.mock.calls[0]?.[0]).not.toMatch(/stripe\.com/);
  });

  it("starts Premium checkout from an AI 403 upgrade prompt", async () => {
    const user = userEvent.setup();
    const startCheckout = vi.fn().mockResolvedValue({
      url: "https://checkout.example.test/premium",
    });
    const assignLocation = vi.fn();

    renderWithProviders(
      <ForbiddenUpgradePrompt
        kind="premium"
        startCheckout={startCheckout}
        assignLocation={assignLocation}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    await user.click(
      screen.getByRole("button", {
        name: "Upgrade to Premium for Virtual Try On",
      }),
    );

    expect(screen.getByRole("button", { name: "Bill monthly" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await waitFor(() => {
      expect(startCheckout).toHaveBeenCalledWith("premium", "monthly");
      expect(assignLocation).toHaveBeenCalledWith(
        "https://checkout.example.test/premium",
      );
    });
  });

  it("sends yearly checkout from paywall prompts for both tiers", async () => {
    const user = userEvent.setup();
    const startCheckout = vi.fn().mockResolvedValue({
      url: "https://checkout.example.test/yearly-basic",
    });
    const assignLocation = vi.fn();

    const { unmount } = renderWithProviders(
      <CatalogLimitPrompt
        kind="wardrobe"
        startCheckout={startCheckout}
        assignLocation={assignLocation}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    await user.click(screen.getByRole("button", { name: "Bill yearly" }));
    await user.click(
      screen.getByRole("button", {
        name: "Upgrade to Basic to add more wardrobes",
      }),
    );

    await waitFor(() => {
      expect(startCheckout).toHaveBeenCalledWith("basic", "yearly");
      expect(assignLocation).toHaveBeenCalledWith(
        "https://checkout.example.test/yearly-basic",
      );
    });
    unmount();

    startCheckout.mockResolvedValue({
      url: "https://checkout.example.test/yearly-premium",
    });
    renderWithProviders(
      <ForbiddenUpgradePrompt
        kind="premium"
        startCheckout={startCheckout}
        assignLocation={assignLocation}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    await user.click(screen.getByRole("button", { name: "Bill yearly" }));
    await user.click(
      screen.getByRole("button", {
        name: "Upgrade to Premium for Virtual Try On",
      }),
    );

    await waitFor(() => {
      expect(startCheckout).toHaveBeenCalledWith("premium", "yearly");
      expect(assignLocation).toHaveBeenCalledWith(
        "https://checkout.example.test/yearly-premium",
      );
    });
  });

  it("shows a friendly message when yearly checkout returns 503 BILLING_PRICE_NOT_FOUND", async () => {
    const user = userEvent.setup();
    const startCheckout = vi.fn().mockRejectedValue(
      new ApiError({
        status: 503,
        code: BILLING_PRICE_NOT_FOUND_CODE,
        message: "No Stripe price configured for yearly billing.",
      }),
    );
    const assignLocation = vi.fn();

    renderWithProviders(
      <ForbiddenUpgradePrompt
        kind="premium"
        startCheckout={startCheckout}
        assignLocation={assignLocation}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    await user.click(screen.getByRole("button", { name: "Bill yearly" }));
    await user.click(
      screen.getByRole("button", {
        name: "Upgrade to Premium for Virtual Try On",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      YEARLY_BILLING_UNAVAILABLE_MESSAGE,
    );
    expect(assignLocation).not.toHaveBeenCalled();
  });

  it("disables double clicks while checkout is starting", async () => {
    const user = userEvent.setup();
    let resolveCheckout: (value: { url: string }) => void = () => undefined;
    const startCheckout = vi.fn(
      () =>
        new Promise<{ url: string }>((resolve) => {
          resolveCheckout = resolve;
        }),
    );
    const assignLocation = vi.fn();

    renderWithProviders(
      <CheckoutUpgradeAction
        checkoutTier="basic"
        actionLabel="Upgrade to Basic"
        actionAriaLabel="Upgrade to Basic"
        startCheckout={startCheckout}
        assignLocation={assignLocation}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    const button = screen.getByRole("button", { name: "Upgrade to Basic" });
    await user.click(button);
    button.click();

    expect(startCheckout).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Upgrade to Basic" }),
    ).toHaveTextContent("Starting checkout…");

    resolveCheckout({ url: "https://checkout.example.test/basic" });
    await waitFor(() => {
      expect(assignLocation).toHaveBeenCalledTimes(1);
    });
  });

  it("shows a named App Store plan after ALREADY_SUBSCRIBED", async () => {
    const user = userEvent.setup();
    const startCheckout = vi.fn().mockRejectedValue(
      new ApiError({
        status: 409,
        code: ALREADY_SUBSCRIBED_CODE,
        source: "ios",
      }),
    );
    const getMe = vi.fn().mockResolvedValue({
      ...mockFreeAtLimitEntitlement,
      paidTier: { tier: "basic", source: "ios" },
    });
    const assignLocation = vi.fn();

    renderWithProviders(
      <CheckoutUpgradeAction
        checkoutTier="basic"
        actionLabel="Upgrade to Basic"
        actionAriaLabel="Upgrade to Basic"
        startCheckout={startCheckout}
        getMe={getMe}
        assignLocation={assignLocation}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    await user.click(screen.getByRole("button", { name: "Upgrade to Basic" }));

    expect(
      await screen.findByText("You already have a plan from the App Store."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Manage this plan in the App Store / Google Play."),
    ).toBeInTheDocument();
    expect(getMe).toHaveBeenCalledTimes(1);
    expect(assignLocation).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Upgrade to Basic" }),
    ).not.toBeInTheDocument();
  });

  it("names Google Play and web/Stripe on ALREADY_SUBSCRIBED", async () => {
    const user = userEvent.setup();
    const startCheckout = vi.fn().mockRejectedValue(
      new ApiError({
        status: 409,
        code: ALREADY_SUBSCRIBED_CODE,
        source: "android",
      }),
    );
    const getMe = vi.fn().mockResolvedValue({
      paidTier: { tier: "premium", source: "android" },
    });

    const { unmount } = renderWithProviders(
      <CheckoutUpgradeAction
        checkoutTier="premium"
        actionLabel="Upgrade to Premium"
        actionAriaLabel="Upgrade to Premium"
        startCheckout={startCheckout}
        getMe={getMe}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    await user.click(screen.getByRole("button", { name: "Upgrade to Premium" }));
    expect(
      await screen.findByText("You already have a plan from Google Play."),
    ).toBeInTheDocument();
    unmount();

    const stripeCheckout = vi.fn().mockRejectedValue(
      new ApiError({
        status: 409,
        code: ALREADY_SUBSCRIBED_CODE,
        source: "stripe",
      }),
    );
    const stripeGetMe = vi.fn().mockResolvedValue({
      paidTier: { tier: "premium", source: "stripe" },
    });
    renderWithProviders(
      <CheckoutUpgradeAction
        checkoutTier="basic"
        actionLabel="Upgrade to Basic"
        actionAriaLabel="Upgrade to Basic"
        startCheckout={stripeCheckout}
        getMe={stripeGetMe}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    await user.click(screen.getByRole("button", { name: "Upgrade to Basic" }));
    expect(
      await screen.findByText("You already have a plan from web/Stripe."),
    ).toBeInTheDocument();
  });

  it("shows a checkout error without redirecting", async () => {
    const user = userEvent.setup();
    const startCheckout = vi.fn().mockRejectedValue(
      new ApiError({
        status: 400,
        code: "BAD_TIER",
        message: "Unsupported plan.",
      }),
    );
    const assignLocation = vi.fn();

    renderWithProviders(
      <CheckoutUpgradeAction
        checkoutTier="basic"
        actionLabel="Upgrade to Basic"
        actionAriaLabel="Upgrade to Basic"
        startCheckout={startCheckout}
        assignLocation={assignLocation}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    await user.click(screen.getByRole("button", { name: "Upgrade to Basic" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unsupported plan.",
    );
    expect(assignLocation).not.toHaveBeenCalled();
  });

  it("hides the Stripe checkout button for store-plan users", () => {
    const startCheckout = vi.fn();

    const { unmount } = renderWithProviders(
      <ForbiddenUpgradePrompt
        kind="premium"
        entitlement={{
          ...mockFreeAtLimitEntitlement,
          paidTier: { tier: "basic", source: "ios" },
        }}
        startCheckout={startCheckout}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    expect(
      screen.getByText("Manage this plan in the App Store / Google Play."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Upgrade to Premium/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Billing interval" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bill monthly" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bill yearly" })).not.toBeInTheDocument();
    unmount();

    renderWithProviders(
      <CatalogLimitPrompt
        kind="item"
        entitlement={{
          ...mockFreeAtLimitEntitlement,
          paidTier: { tier: "basic" },
        }}
        startCheckout={startCheckout}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    expect(
      screen.getByText("Manage this plan in the App Store / Google Play."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Upgrade to Basic/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Billing interval" }),
    ).not.toBeInTheDocument();
    expect(startCheckout).not.toHaveBeenCalled();
  });

  it("sends a Stripe Basic subscriber who hits an AI 403 to Settings plan", () => {
    renderWithProviders(
      <ForbiddenUpgradePrompt
        kind="premium"
        entitlement={{
          ...mockFreeAtLimitEntitlement,
          paidTier: { tier: "basic", source: "stripe" },
        }}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    expect(
      screen.getByRole("link", { name: "Manage this plan in Settings" }),
    ).toHaveAttribute("href", appPaths.appSettingsPlan);
    expect(
      screen.queryByRole("button", { name: /Upgrade to Premium/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Billing interval" }),
    ).not.toBeInTheDocument();
  });
});
