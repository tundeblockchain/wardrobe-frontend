import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "../../routes/ProtectedRoute";
import { appPaths } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import {
  clearResourceQueryCache,
  getCachedResourceQuery,
  SESSION_QUERY_CACHE_KEYS,
  setCachedResourceQuery,
} from "../../hooks/resourceQueryCache";
import { AppSidebar } from "./AppSidebar";
import { dashboardLogOutLabel } from "./dashboardNav";

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

const seedSessionCache = () => {
  setCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.me, {
    id: "user-1",
    email: "user@example.com",
  });
  setCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.wardrobes, [{ id: "w1" }]);
  setCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.plan, {
    paidTier: { tier: "basic" },
  });
  setCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.presets, [
    { aiProfileId: "preset-1" },
  ]);
  setCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.billingInterval, "yearly");
};

const expectSessionCacheCleared = () => {
  expect(getCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.me)).toBeUndefined();
  expect(
    getCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.wardrobes),
  ).toBeUndefined();
  expect(getCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.plan)).toBeUndefined();
  expect(
    getCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.presets),
  ).toBeUndefined();
  expect(
    getCachedResourceQuery(SESSION_QUERY_CACHE_KEYS.billingInterval),
  ).toBeUndefined();
};

const renderSidebar = (collapsed = false) => {
  return renderWithProviders(
    <>
      <Routes>
        <Route
          path={appPaths.app}
          element={
            <ProtectedRoute>
              <AppSidebar
                collapsed={collapsed}
                isMobile={false}
                mobileOpen={false}
                onCloseMobile={() => undefined}
              />
            </ProtectedRoute>
          }
        />
        <Route path={appPaths.login} element={<p>Sign in page</p>} />
      </Routes>
      <RouteLocation />
    </>,
    {
      route: appPaths.app,
      auth: { user: { id: "user-1", email: "user@example.com" } },
    },
  );
};

const getAppNav = () => screen.getByRole("navigation", { name: "App" });

const getLogOutButton = () =>
  within(getAppNav()).getByRole("button", { name: dashboardLogOutLabel });

describe("AppSidebar log out", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authProviderMocks.getIdToken.mockResolvedValue("test-id-token");
    authProviderMocks.signOutUser.mockResolvedValue(undefined);
    clearResourceQueryCache();
  });

  afterEach(() => {
    clearResourceQueryCache();
  });

  it("renders a Log out item under the nav list", () => {
    renderSidebar();

    const appNav = getAppNav();
    const navLinks = within(appNav).getAllByRole("link");
    const logOutButton = getLogOutButton();

    expect(logOutButton).toHaveAttribute("aria-label", dashboardLogOutLabel);
    expect(logOutButton).toHaveTextContent(dashboardLogOutLabel);
    expect(
      navLinks[navLinks.length - 1]?.compareDocumentPosition(logOutButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows only the icon with a tooltip and aria-label when collapsed", async () => {
    const user = userEvent.setup();
    renderSidebar(true);

    const logOutButton = getLogOutButton();
    expect(logOutButton).toHaveAttribute("aria-label", dashboardLogOutLabel);
    expect(logOutButton).not.toHaveTextContent(dashboardLogOutLabel);

    await user.hover(logOutButton);

    expect(
      await screen.findByRole("tooltip", { name: dashboardLogOutLabel }),
    ).toBeInTheDocument();
  });

  it("signs out, clears cached /me, wardrobes, plan, presets, and billing interval, and navigates to login", async () => {
    const user = userEvent.setup();
    seedSessionCache();
    renderSidebar();

    await user.click(getLogOutButton());

    expect(authProviderMocks.signOutUser).toHaveBeenCalledTimes(1);
    expectSessionCacheCleared();
    expect(await screen.findByText("Sign in page")).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      appPaths.login,
    );
  });

  it("is keyboard accessible and ignores a second activation while signing out", async () => {
    const user = userEvent.setup();
    let resolveSignOut: () => void = () => undefined;
    authProviderMocks.signOutUser.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSignOut = resolve;
        }),
    );
    seedSessionCache();
    renderSidebar();

    const logOutButton = getLogOutButton();
    logOutButton.focus();
    expect(logOutButton).toHaveFocus();

    await user.keyboard("{Enter}");
    await user.keyboard("{Enter}");

    expect(logOutButton).toBeDisabled();
    expect(authProviderMocks.signOutUser).toHaveBeenCalledTimes(1);

    resolveSignOut();

    expect(await screen.findByText("Sign in page")).toBeInTheDocument();
    expectSessionCacheCleared();
  });

  it("clears the cache and navigates to login when sign-out throws", async () => {
    const user = userEvent.setup();
    authProviderMocks.signOutUser.mockRejectedValue(new Error("Sign-out failed"));
    seedSessionCache();
    renderSidebar();

    await user.click(getLogOutButton());

    expect(authProviderMocks.signOutUser).toHaveBeenCalledTimes(1);
    expectSessionCacheCleared();
    expect(await screen.findByText("Sign in page")).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      appPaths.login,
    );
  });
});
