import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
    <div data-testid="route-location">{`${location.pathname}${location.search}`}</div>
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
) => {
  return renderWithProviders(
    <DashboardThemeProvider>
      <Routes>
        <Route
          path={appPaths.appSettings}
          element={
            <ProtectedRoute>
              <SettingsPage resourceApi={resourceApi} />
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
        <Route path={appPaths.login} element={<p>Sign in page</p>} />
      </Routes>
      <RouteLocation />
    </DashboardThemeProvider>,
    {
      route: appPaths.appSettings,
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
    expect(screen.getAllByText("Premium").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "This plan was bought on the web. Payment management is not available here.",
      ),
    ).toBeInTheDocument();
    await expectBoundedGetMeFetches(getMe);
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

  it("shows an App Store plan and tells the user to manage it in the app", async () => {
    renderSettings(
      createMockResourceApi(
        {},
        {
          entitlement: entitlement({
            tier: "PREMIUM",
            status: "ACTIVE",
            store: "APP_STORE",
          }),
        },
      ),
    );

    expect(await screen.findByText("App Store")).toBeInTheDocument();
    expect(screen.getAllByText("Premium").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "This plan was bought on the App Store. Manage it in the iOS app.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Stripe/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /manage payment/i })).not.toBeInTheDocument();
  });

  it("shows a Play Store plan and tells the user to manage it in the app", async () => {
    renderSettings(
      createMockResourceApi(
        {},
        {
          entitlement: entitlement({
            tier: "BASIC",
            status: "ACTIVE",
            store: "PLAY_STORE",
          }),
        },
      ),
    );

    expect(await screen.findByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("Google Play")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This plan was bought on Google Play. Manage it in the Android app.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a Stripe plan without payment management", async () => {
    renderSettings(
      createMockResourceApi(
        {},
        {
          entitlement: entitlement({
            tier: "PREMIUM",
            status: "ACTIVE",
            store: "STRIPE",
          }),
        },
      ),
    );

    expect(await screen.findByText("Web")).toBeInTheDocument();
    expect(screen.getAllByText("Premium").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "This plan was bought on the web. Payment management is not available here.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /customer portal|billing|checkout/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the Free plan when no store is present", async () => {
    renderSettings(
      createMockResourceApi(
        {},
        { entitlement: mockFreeAtLimitEntitlement },
      ),
    );

    expect(await screen.findByText("Free")).toBeInTheDocument();
    expect(
      screen.getByText("The Free plan is included with the account."),
    ).toBeInTheDocument();
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
        "Deleting this account does not cancel App Store or Google Play subscriptions. Cancel those in the store first.",
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
  });

  it("stays signed in and offers Retry delete when delete account fails", async () => {
    const user = userEvent.setup();
    const deleteAccount = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({
          status: 500,
          code: "ACCOUNT_DELETION_FAILED",
          message: "Account data deletion failed.",
        }),
      )
      .mockResolvedValueOnce({ deleted: true });
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

    expect(
      await screen.findByText("Account data deletion failed."),
    ).toBeInTheDocument();
    expect(authProviderMocks.signOutUser).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "Delete this account?" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      appPaths.appSettings,
    );
    expect(screen.queryByText("Sign in page")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry delete" }));

    await waitFor(() => {
      expect(authProviderMocks.signOutUser).toHaveBeenCalledTimes(1);
    });
    expect(deleteAccount).toHaveBeenCalledTimes(2);
  });

  it("offers Retry delete when DELETE /me times out", async () => {
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

    expect(await screen.findByText("Request timed out.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry delete" })).toBeEnabled();
    expect(authProviderMocks.signOutUser).not.toHaveBeenCalled();
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
