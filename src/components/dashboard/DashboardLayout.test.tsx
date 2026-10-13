import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppHomePage } from "../../pages/app/AppHomePage";
import { OutfitsPage } from "../../pages/app/OutfitsPage";
import { PlanPage } from "../../pages/app/PlanPage";
import { VirtualProfilesPage } from "../../pages/app/VirtualProfilesPage";
import { WardrobesPage } from "../../pages/app/WardrobesPage";
import { ProtectedRoute } from "../../routes/ProtectedRoute";
import { appPaths } from "../../routes/paths";
import { stubMatchMedia } from "../../test/matchMedia";
import { renderWithProviders } from "../../test/renderWithProviders";
import { DashboardLayout } from "./DashboardLayout";
import { SIDEBAR_COLLAPSED_STORAGE_KEY } from "./sidebarCollapsed";

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

const renderDashboard = (route = appPaths.app) => {
  return renderWithProviders(
    <>
      <Routes>
        <Route
          path={appPaths.app}
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AppHomePage />} />
          <Route path="wardrobes" element={<WardrobesPage />} />
          <Route path="outfits" element={<OutfitsPage />} />
          <Route path="virtual-profiles" element={<VirtualProfilesPage />} />
          <Route path="plan" element={<PlanPage />} />
        </Route>
        <Route path={appPaths.login} element={<p>Sign in page</p>} />
      </Routes>
      <RouteLocation />
    </>,
    {
      route,
      auth: { user: { id: "user-1", email: "user@example.com" } },
    },
  );
};

const getAppNav = () => screen.getByRole("navigation", { name: "App" });

describe("DashboardLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authProviderMocks.signOutUser.mockResolvedValue(undefined);
    window.localStorage.removeItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    stubMatchMedia(false);
  });

  afterEach(() => {
    window.localStorage.removeItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
  });

  it("renders sidebar nav links and navigates to placeholder pages", async () => {
    const user = userEvent.setup();
    renderDashboard();

    const appNav = getAppNav();
    expect(within(appNav).getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      appPaths.app,
    );
    expect(
      within(appNav).getByRole("link", { name: "Wardrobes" }),
    ).toHaveAttribute("href", appPaths.appWardrobes);
    expect(
      within(appNav).getByRole("link", { name: "Outfits" }),
    ).toHaveAttribute("href", appPaths.appOutfits);
    expect(
      within(appNav).getByRole("link", { name: "Virtual Profiles" }),
    ).toHaveAttribute("href", appPaths.appVirtualProfiles);
    expect(within(appNav).getByRole("link", { name: "Plan" })).toHaveAttribute(
      "href",
      appPaths.appPlan,
    );

    await user.click(within(appNav).getByRole("link", { name: "Wardrobes" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Wardrobes" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      appPaths.appWardrobes,
    );

    await user.click(
      within(getAppNav()).getByRole("link", { name: "Virtual Profiles" }),
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "Virtual Profiles" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Create a Virtual Profile and preview looks with Virtual Try On/),
    ).toBeInTheDocument();
  });

  it("persists sidebar collapse in localStorage", async () => {
    const user = userEvent.setup();
    const { unmount } = renderDashboard();

    expect(
      screen.getByRole("button", { name: "Collapse sidebar" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    expect(
      screen.getByRole("button", { name: "Expand sidebar" }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe(
      "true",
    );

    unmount();
    renderDashboard();

    expect(
      screen.getByRole("button", { name: "Expand sidebar" }),
    ).toBeInTheDocument();
  });

  it("signs out from the top-bar account menu", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Account menu" }));
    expect(
      screen.getByRole("menuitem", { name: "Signed in as user@example.com" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Sign out" }));

    expect(authProviderMocks.signOutUser).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Sign in page")).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      "/login?next=%2Fapp",
    );
  });

  it("toggles the temporary drawer on mobile", async () => {
    stubMatchMedia(true);
    const user = userEvent.setup();
    renderDashboard();

    expect(
      screen.getByRole("button", { name: "Open navigation" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "App" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open navigation" }));

    const appNav = await screen.findByRole("navigation", { name: "App" });
    expect(
      within(appNav).getByRole("link", { name: "Wardrobes" }),
    ).toBeInTheDocument();

    await user.click(within(appNav).getByRole("link", { name: "Outfits" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Outfits" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "App" }),
    ).not.toBeInTheDocument();
  });
});
