import { useState } from "react";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BILLING_CANCEL_FAILED_CODE } from "../../api/billing";
import { ApiError } from "../../api/httpClient";
import {
  createAiTryOnOffResourceApi,
  createErrorResourceApi,
  createMockResourceApi,
  mockContentWipeResult,
  mockEntitlement,
  mockFreeAtLimitEntitlement,
} from "../../api/mockResourceApi";
import type { Entitlement } from "../../api/resourceTypes";
import { consumeLoginNotice } from "../../auth/loginNotice";
import { ContactPage } from "../ContactPage";
import { ProtectedRoute } from "../../routes/ProtectedRoute";
import { appPaths, getContactPath } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import {
  createUnstableGetMeApi,
  expectBoundedGetMeFetches,
} from "../../test/unstableGetMeApi";
import { DashboardThemeProvider } from "../../theme/DashboardThemeProvider";
import { THEME_PREFERENCE_STORAGE_KEY } from "../../theme/themePreference";
import { InboxPage } from "./InboxPage";
import { SettingsPage } from "./SettingsPage";
import { VirtualTryOnPage } from "./VirtualTryOnPage";

const authProviderMocks = vi.hoisted(() => ({
  signInWithGoogle: vi.fn(),
  signInWithApple: vi.fn(),
  signInWithEmail: vi.fn(),
  registerWithEmail: vi.fn(),
  sendPasswordReset: vi.fn(),
  signOutUser: vi.fn(),
  getIdToken: vi.fn(),
}));

vi.mock("../../auth/authProviders", () => authProviderMocks);

const RouteLocation = () => {
  const location = useLocation();
  return (
    <div data-testid="route-location">{`${location.pathname}${location.search}${location.hash}`}</div>
  );
};

const LoginRoute = () => {
  const [notice] = useState(() => consumeLoginNotice());
  return (
    <>
      <p>Sign in page</p>
      {notice ? (
        <div role="alert">{notice}</div>
      ) : null}
    </>
  );
};

const entitlement = (overrides: Partial<Entitlement> = {}): Entitlement => {
  return {
    ...mockEntitlement,
    ...overrides,
  };
};

const renderSettings = (
  resourceApi = createMockResourceApi(),
  user: {
    id: string;
    email?: string;
    displayName?: string;
    provider?: "google" | "apple" | "email";
  } = {
    id: "user-1",
    email: "user@example.com",
    displayName: "Sample User",
    provider: "google",
  },
  options: {
    route?: string;
    assignBillingUrl?: (url: string) => void;
  } = {},
) => {
  return renderWithProviders(
    <DashboardThemeProvider>
      <Routes>
        <Route
          path={appPaths.appSettings}
          element={
            <ProtectedRoute>
              <SettingsPage
                resourceApi={resourceApi}
                assignBillingUrl={options.assignBillingUrl}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path={appPaths.appVirtualTryOn}
          element={<VirtualTryOnPage resourceApi={resourceApi} />}
        />
        <Route
          path={appPaths.appInbox}
          element={<InboxPage resourceApi={resourceApi} />}
        />
        <Route path={appPaths.contact} element={<ContactPage />} />
        <Route path={appPaths.login} element={<LoginRoute />} />
      </Routes>
      <RouteLocation />
    </DashboardThemeProvider>,
    {
      route: options.route ?? appPaths.appSettings,
      auth: { user },
    },
  );
};

const typePhraseAndConfirm = async (
  user: ReturnType<typeof userEvent.setup>,
  dialogName: string,
  phrase: string,
  confirmName: string,
) => {
  const dialog = screen.getByRole("dialog", { name: dialogName });
  await user.type(
    within(dialog).getByRole("textbox", {
      name: `Type ${phrase} to confirm`,
    }),
    phrase,
  );
  await user.click(within(dialog).getByRole("button", { name: confirmName }));
  return dialog;
};

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    authProviderMocks.getIdToken.mockResolvedValue("test-id-token");
    authProviderMocks.signOutUser.mockResolvedValue(undefined);
    window.localStorage.removeItem(THEME_PREFERENCE_STORAGE_KEY);
  });

  it("renders View plan without refetching GET /me in a loop", async () => {
    const getMe = vi.fn().mockResolvedValue(mockEntitlement);
    renderSettings(createUnstableGetMeApi(getMe));

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Profile & Settings",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plan" })).toBeInTheDocument();
    expect(document.getElementById("plan")).toBeInTheDocument();
    expect(screen.getAllByText("Premium").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Manage subscription" }),
    ).toBeInTheDocument();
    await expectBoundedGetMeFetches(getMe);
  });

  it("keeps the #plan anchor on the Plan section", async () => {
    renderSettings(createMockResourceApi(), undefined, {
      route: "/app/settings#plan",
    });

    expect(
      await screen.findByRole("heading", { name: "Plan" }),
    ).toBeInTheDocument();
    const planSection = document.getElementById("plan");
    expect(planSection).toBeInTheDocument();
    expect(planSection).toHaveAttribute("id", "plan");
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      "/app/settings#plan",
    );
  });

  it("shows account details and the Firebase sign-in provider", async () => {
    renderSettings();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Profile & Settings",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sample User")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByText("Signed in with Google")).toBeInTheDocument();
  });

  it("labels Apple and Email sign-in from providerData", async () => {
    const { unmount } = renderSettings(createMockResourceApi(), {
      id: "user-1",
      email: "user@example.com",
      displayName: "Sample User",
      provider: "apple",
    });

    expect(await screen.findByText("Signed in with Apple")).toBeInTheDocument();
    unmount();

    renderSettings(createMockResourceApi(), {
      id: "user-1",
      email: "user@example.com",
      displayName: "Sample User",
      provider: "email",
    });
    expect(await screen.findByText("Signed in with Email")).toBeInTheDocument();
  });

  it("persists a theme preference", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Use the dark theme" }));

    expect(window.localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY)).toBe(
      "dark",
    );
    expect(
      screen.getByRole("button", { name: "Use the dark theme" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("shows a Free plan with Basic and Premium upgrade buttons", async () => {
    renderSettings(
      createMockResourceApi(
        {},
        { entitlement: mockFreeAtLimitEntitlement },
      ),
    );

    expect(await screen.findByText("Free")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upgrade to Basic" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upgrade to Premium" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Manage subscription" }),
    ).not.toBeInTheDocument();
  });

  it("shows a Basic Stripe plan with Manage subscription", async () => {
    renderSettings(
      createMockResourceApi(
        {},
        {
          entitlement: entitlement({
            tier: "BASIC",
            status: "ACTIVE",
            store: "STRIPE",
            expiresAt: "2026-11-01T00:00:00.000Z",
            paidTier: {
              tier: "basic",
              source: "stripe",
              expiresAt: "2026-11-01T00:00:00.000Z",
            },
          }),
        },
      ),
    );

    expect(await screen.findByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("1 November 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Manage subscription" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/App Store|Google Play/i),
    ).not.toBeInTheDocument();
  });

  it("shows a Premium iOS plan without a Stripe button", async () => {
    renderSettings(
      createMockResourceApi(
        {},
        {
          entitlement: entitlement({
            tier: "PREMIUM",
            status: "ACTIVE",
            store: "APP_STORE",
            expiresAt: "2026-12-15T00:00:00.000Z",
            paidTier: {
              tier: "premium",
              source: "ios",
              expiresAt: "2026-12-15T00:00:00.000Z",
            },
          }),
        },
      ),
    );

    expect(await screen.findByText("Premium")).toBeInTheDocument();
    expect(screen.getByText("15 December 2026")).toBeInTheDocument();
    expect(
      screen.getByText("Manage this plan in the App Store."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Manage subscription" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Stripe/i)).not.toBeInTheDocument();
  });

  it("shows generic store text when paidTier source is missing", async () => {
    renderSettings(
      createMockResourceApi(
        {},
        {
          entitlement: entitlement({
            tier: "PREMIUM",
            status: "ACTIVE",
            paidTier: {
              tier: "premium",
              expiresAt: "2026-11-01T00:00:00.000Z",
            },
          }),
        },
      ),
    );

    expect(await screen.findByText("Premium")).toBeInTheDocument();
    expect(
      screen.getByText("Manage this plan in the App Store or Google Play."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Manage subscription" }),
    ).not.toBeInTheDocument();
  });

  it("calls the portal and redirects when Manage subscription is clicked", async () => {
    const user = userEvent.setup();
    const createPortalSession = vi.fn().mockResolvedValue({
      url: "https://billing.stripe.com/p/session/test",
    });
    const assignBillingUrl = vi.fn();
    renderSettings(
      createMockResourceApi({ createPortalSession }),
      undefined,
      { assignBillingUrl },
    );

    await user.click(
      await screen.findByRole("button", { name: "Manage subscription" }),
    );

    await waitFor(() => {
      expect(createPortalSession).toHaveBeenCalledTimes(1);
    });
    expect(assignBillingUrl).toHaveBeenCalledWith(
      "https://billing.stripe.com/p/session/test",
    );
  });

  it("refreshes /me and shows store copy on 409 NOT_STRIPE_PLAN", async () => {
    const user = userEvent.setup();
    const stripePlan = entitlement({
      tier: "BASIC",
      status: "ACTIVE",
      store: "STRIPE",
      paidTier: { tier: "basic", source: "stripe" },
    });
    const iosPlan = entitlement({
      tier: "BASIC",
      status: "ACTIVE",
      store: "APP_STORE",
      paidTier: { tier: "basic", source: "ios" },
    });
    let currentPlan = stripePlan;
    const getMe = vi.fn(async () => currentPlan);
    const createPortalSession = vi.fn().mockImplementation(async () => {
      currentPlan = iosPlan;
      throw new ApiError({
        status: 409,
        code: "NOT_STRIPE_PLAN",
        message: "Manage plan is only available for Stripe subscriptions.",
        source: "ios",
      });
    });
    renderSettings(createMockResourceApi({ getMe, createPortalSession }));

    await user.click(
      await screen.findByRole("button", { name: "Manage subscription" }),
    );

    expect(
      await screen.findByText("Manage this plan in the App Store."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Manage subscription" }),
    ).not.toBeInTheDocument();
    expect(createPortalSession).toHaveBeenCalledTimes(1);
    expect(getMe.mock.calls.length).toBeGreaterThan(1);
  });

  it("calls checkout with the selected tier from Free upgrade buttons", async () => {
    const user = userEvent.setup();
    const createCheckoutSession = vi.fn().mockResolvedValue({
      url: "https://checkout.stripe.com/c/pay/cs_basic",
    });
    const assignBillingUrl = vi.fn();
    renderSettings(
      createMockResourceApi(
        { createCheckoutSession },
        { entitlement: mockFreeAtLimitEntitlement },
      ),
      undefined,
      { assignBillingUrl },
    );

    await user.click(
      await screen.findByRole("button", { name: "Upgrade to Basic" }),
    );

    await waitFor(() => {
      expect(createCheckoutSession).toHaveBeenCalledWith("basic");
    });
    expect(assignBillingUrl).toHaveBeenCalledWith(
      "https://checkout.stripe.com/c/pay/cs_basic",
    );

    createCheckoutSession.mockResolvedValue({
      url: "https://checkout.stripe.com/c/pay/cs_premium",
    });
    await user.click(
      screen.getByRole("button", { name: "Upgrade to Premium" }),
    );

    await waitFor(() => {
      expect(createCheckoutSession).toHaveBeenCalledWith("premium");
    });
    expect(assignBillingUrl).toHaveBeenCalledWith(
      "https://checkout.stripe.com/c/pay/cs_premium",
    );
  });

  it("refreshes /me and shows the current plan on 409 ALREADY_SUBSCRIBED", async () => {
    const user = userEvent.setup();
    const subscribedPlan = entitlement({
      tier: "BASIC",
      status: "ACTIVE",
      store: "STRIPE",
      paidTier: { tier: "basic", source: "stripe" },
    });
    let currentPlan: Entitlement = mockFreeAtLimitEntitlement;
    const getMe = vi.fn(async () => currentPlan);
    const createCheckoutSession = vi.fn().mockImplementation(async () => {
      currentPlan = subscribedPlan;
      throw new ApiError({
        status: 409,
        code: "ALREADY_SUBSCRIBED",
        message: "This account already has a paid plan.",
        source: "stripe",
      });
    });
    renderSettings(
      createMockResourceApi({ getMe, createCheckoutSession }),
    );

    await user.click(
      await screen.findByRole("button", { name: "Upgrade to Basic" }),
    );

    expect(
      await screen.findByRole("button", { name: "Manage subscription" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upgrade to Basic" }),
    ).not.toBeInTheDocument();
  });

  it("shows a portal error without redirecting on a failed manage request", async () => {
    const user = userEvent.setup();
    const createPortalSession = vi.fn().mockRejectedValue(
      new ApiError({
        status: 500,
        code: "INTERNAL",
        message: "Portal is unavailable.",
      }),
    );
    const assignBillingUrl = vi.fn();
    renderSettings(
      createMockResourceApi({ createPortalSession }),
      undefined,
      { assignBillingUrl },
    );

    await user.click(
      await screen.findByRole("button", { name: "Manage subscription" }),
    );

    expect(await screen.findByText("Portal is unavailable.")).toBeInTheDocument();
    expect(assignBillingUrl).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Manage subscription" }),
    ).toBeEnabled();
  });

  it("links Virtual Try On to the existing page and keeps Premium gating", async () => {
    const user = userEvent.setup();
    renderSettings(createAiTryOnOffResourceApi());

    const tryOnLink = await screen.findByRole("link", {
      name: "Open Virtual Try On",
    });
    expect(tryOnLink).toHaveAttribute("href", appPaths.appVirtualTryOn);
    expect(screen.getByLabelText("Premium")).toBeInTheDocument();

    await user.click(tryOnLink);

    expect(
      await screen.findByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View plan for Virtual Try On" }),
    ).toHaveAttribute("href", appPaths.appPlan);
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      appPaths.appVirtualTryOn,
    );
  });

  it("shows an Inbox entry with an unread badge from GET /me/events", async () => {
    const user = userEvent.setup();
    renderSettings();

    const inboxLink = await screen.findByRole("link", {
      name: "Open inbox, unread messages: 1",
    });
    expect(inboxLink).toHaveAttribute("href", appPaths.appInbox);

    await user.click(inboxLink);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Inbox" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Virtual Try On is ready")).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      appPaths.appInbox,
    );
  });

  it("links Contact us and Report a bug to the existing contact form", async () => {
    const user = userEvent.setup();
    renderSettings();

    const contactLink = screen.getByRole("link", { name: "Contact us" });
    const bugLink = screen.getByRole("link", { name: "Report a bug" });
    expect(contactLink).toHaveAttribute("href", appPaths.contact);
    expect(bugLink).toHaveAttribute("href", getContactPath("bug"));

    await user.click(bugLink);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Report a bug" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Subject" })).toHaveValue(
      "Report a bug",
    );
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      getContactPath("bug"),
    );
  });

  it("clears all content after typing CLEAR and stays signed in", async () => {
    const user = userEvent.setup();
    const getMe = vi.fn().mockResolvedValue(mockEntitlement);
    const clearContent = vi.fn().mockResolvedValue(mockContentWipeResult);
    renderSettings(createMockResourceApi({ getMe, clearContent }));

    await user.click(
      screen.getByRole("button", { name: "Clear all wardrobe content" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Clear all content?" });
    expect(
      within(dialog).getByRole("button", { name: "Clear all content" }),
    ).toBeDisabled();

    await typePhraseAndConfirm(
      user,
      "Clear all content?",
      "CLEAR",
      "Clear all content",
    );

    await waitFor(() => {
      expect(clearContent).toHaveBeenCalledTimes(1);
    });
    expect(
      await screen.findByText(
        "All wardrobe content was cleared. You are still signed in.",
      ),
    ).toBeInTheDocument();
    expect(authProviderMocks.signOutUser).not.toHaveBeenCalled();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      appPaths.appSettings,
    );
    await waitFor(() => {
      expect(getMe.mock.calls.length).toBeGreaterThan(1);
    });
  });

  it("shows the error and stays signed in when clear content fails", async () => {
    const user = userEvent.setup();
    const clearContent = vi.fn().mockRejectedValue(
      new ApiError({
        status: 500,
        code: "CONTENT_WIPE_FAILED",
        message: "Could not clear wardrobe content.",
      }),
    );
    renderSettings(createMockResourceApi({ clearContent }));

    await user.click(
      screen.getByRole("button", { name: "Clear all wardrobe content" }),
    );
    await typePhraseAndConfirm(
      user,
      "Clear all content?",
      "CLEAR",
      "Clear all content",
    );

    expect(
      await screen.findByText("Could not clear wardrobe content."),
    ).toBeInTheDocument();
    expect(authProviderMocks.signOutUser).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "Clear all content?" }),
    ).toBeInTheDocument();
  });

  it("does not call the server when clear content is cancelled", async () => {
    const user = userEvent.setup();
    const clearContent = vi.fn();
    renderSettings(createMockResourceApi({ clearContent }));

    await user.click(
      screen.getByRole("button", { name: "Clear all wardrobe content" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Clear all content?",
    });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(clearContent).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Clear all content?" }),
      ).not.toBeInTheDocument();
    });
  });

  it("signs out only after DELETE /me confirms success", async () => {
    const user = userEvent.setup();
    let resolveDelete: ((value: { deleted: true }) => void) | undefined;
    const deleteAccount = vi.fn(
      () =>
        new Promise<{ deleted: true }>((resolve) => {
          resolveDelete = resolve;
        }),
    );
    renderSettings(createMockResourceApi({ deleteAccount }));

    await user.click(
      screen.getByRole("button", { name: "Delete this account" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Delete this account?",
    });
    expect(
      within(dialog).getByText(
        "App Store and Google Play plans need cancelling separately. Stripe web plans are cancelled automatically.",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Delete account" }),
    ).toBeDisabled();

    await user.type(
      within(dialog).getByRole("textbox", { name: "Type DELETE to confirm" }),
      "delete",
    );
    expect(
      within(dialog).getByRole("button", { name: "Delete account" }),
    ).toBeDisabled();

    await user.clear(
      within(dialog).getByRole("textbox", { name: "Type DELETE to confirm" }),
    );
    await user.type(
      within(dialog).getByRole("textbox", { name: "Type DELETE to confirm" }),
      "DELETE",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Delete account" }),
    );

    expect(deleteAccount).toHaveBeenCalledTimes(1);
    expect(authProviderMocks.signOutUser).not.toHaveBeenCalled();

    resolveDelete?.({ deleted: true });

    await waitFor(() => {
      expect(authProviderMocks.signOutUser).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText("Sign in page")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("signs out, goes to login, and shows try again when DELETE /me returns 503 BILLING_CANCEL_FAILED", async () => {
    const user = userEvent.setup();
    const deleteAccount = vi.fn().mockRejectedValue(
      new ApiError({
        status: 503,
        code: BILLING_CANCEL_FAILED_CODE,
        message: "Could not cancel the web subscription.",
      }),
    );
    renderSettings(createMockResourceApi({ deleteAccount }));

    await user.click(
      screen.getByRole("button", { name: "Delete this account" }),
    );
    await typePhraseAndConfirm(
      user,
      "Delete this account?",
      "DELETE",
      "Delete account",
    );

    await waitFor(() => {
      expect(authProviderMocks.signOutUser).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText("Sign in page")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't delete this account. Sign in and try again.",
    );
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      "/login?next=%2Fapp%2Fsettings",
    );
  });

  it("signs out and shows try again for any failed DELETE /me", async () => {
    const user = userEvent.setup();
    const deleteAccount = vi.fn().mockRejectedValue(
      new ApiError({
        status: 0,
        code: "TIMEOUT",
        message: "Request timed out.",
      }),
    );
    renderSettings(createMockResourceApi({ deleteAccount }));

    await user.click(
      screen.getByRole("button", { name: "Delete this account" }),
    );
    await typePhraseAndConfirm(
      user,
      "Delete this account?",
      "DELETE",
      "Delete account",
    );

    await waitFor(() => {
      expect(authProviderMocks.signOutUser).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText("Sign in page")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't delete this account. Sign in and try again.",
    );
  });

  it("does not call the server when delete is cancelled", async () => {
    const user = userEvent.setup();
    const deleteAccount = vi.fn();
    renderSettings(createMockResourceApi({ deleteAccount }));

    await user.click(
      screen.getByRole("button", { name: "Delete this account" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Delete this account?",
    });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(deleteAccount).not.toHaveBeenCalled();
    expect(authProviderMocks.signOutUser).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Delete this account?" }),
      ).not.toBeInTheDocument();
    });
  });

  it("renders a plan error without signing out", async () => {
    renderSettings(createErrorResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Couldn't load this plan",
      }),
    ).toBeInTheDocument();
    expect(authProviderMocks.signOutUser).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Open inbox" })).toBeInTheDocument();
  });
});
