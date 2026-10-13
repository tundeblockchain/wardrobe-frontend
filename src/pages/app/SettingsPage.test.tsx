import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/httpClient";
import {
  createErrorResourceApi,
  createMockResourceApi,
  mockEntitlement,
  mockFreeAtLimitEntitlement,
} from "../../api/mockResourceApi";
import type { Entitlement } from "../../api/resourceTypes";
import { ProtectedRoute } from "../../routes/ProtectedRoute";
import { appPaths } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { DashboardThemeProvider } from "../../theme/DashboardThemeProvider";
import { THEME_PREFERENCE_STORAGE_KEY } from "../../theme/themePreference";
import { SettingsPage } from "./SettingsPage";

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
  user = {
    id: "user-1",
    email: "user@example.com",
    displayName: "Jordan Lee",
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

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authProviderMocks.getIdToken.mockResolvedValue("test-id-token");
    authProviderMocks.signOutUser.mockResolvedValue(undefined);
    window.localStorage.removeItem(THEME_PREFERENCE_STORAGE_KEY);
  });

  it("shows account details from the signed-in session", async () => {
    renderSettings();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Profile & Settings",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
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

    expect(await screen.findByText("Premium")).toBeInTheDocument();
    expect(screen.getByText("App Store")).toBeInTheDocument();
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

    expect(await screen.findByText("Premium")).toBeInTheDocument();
    expect(screen.getByText("Web")).toBeInTheDocument();
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

  it("stays signed in and shows the error when delete account fails", async () => {
    const user = userEvent.setup();
    const deleteAccount = vi.fn().mockRejectedValue(
      new ApiError({
        status: 500,
        code: "ACCOUNT_DELETION_FAILED",
        message: "Account data deletion failed.",
      }),
    );
    renderSettings(createMockResourceApi({ deleteAccount }));

    await user.click(
      screen.getByRole("button", { name: "Delete this account" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete account" }));

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
  });
});
