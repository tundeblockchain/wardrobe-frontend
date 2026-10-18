import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LOGO_PATH } from "../../content/brandAssets";
import { AppHomePage } from "../../pages/app/AppHomePage";
import { OutfitsPage } from "../../pages/app/OutfitsPage";
import { SettingsPage } from "../../pages/app/SettingsPage";
import { VirtualProfilesPage } from "../../pages/app/VirtualProfilesPage";
import { VirtualTryOnPage } from "../../pages/app/VirtualTryOnPage";
import { WardrobesPage } from "../../pages/app/WardrobesPage";
import { ProtectedRoute } from "../../routes/ProtectedRoute";
import { appPaths } from "../../routes/paths";
import { stubMatchMedia } from "../../test/matchMedia";
import { renderWithProviders } from "../../test/renderWithProviders";
import { DashboardLayout } from "./DashboardLayout";
import { DASHBOARD_PAPER_TEST_ID } from "./DashboardPaper";
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
          <Route path="virtual-try-on" element={<VirtualTryOnPage />} />
          <Route path="pricing" element={<h1>Pricing</h1>} />
          <Route path="settings" element={<SettingsPage />} />
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
    authProviderMocks.getIdToken.mockResolvedValue("test-id-token");
    authProviderMocks.signOutUser.mockResolvedValue(undefined);
    window.localStorage.removeItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    stubMatchMedia(false);
  });

  afterEach(() => {
    window.localStorage.removeItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
  });

  it("renders sidebar nav links and navigates to signed-in pages", async () => {
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
      within(appNav).queryByRole("link", { name: "Virtual Profiles" }),
    ).not.toBeInTheDocument();
    expect(
      within(appNav).getByRole("link", { name: "Virtual Try On" }),
    ).toHaveAttribute("href", appPaths.appVirtualTryOn);
    expect(
      within(appNav).getByRole("link", { name: "Upgrade" }),
    ).toHaveAttribute("href", appPaths.appPricing);
    expect(
      within(appNav).getByRole("link", { name: "Profile & Settings" }),
    ).toHaveAttribute("href", appPaths.appSettings);
    expect(
      within(appNav).queryByRole("link", { name: "Plan" }),
    ).not.toBeInTheDocument();
    expect(
      within(appNav).getByRole("button", { name: "Log out" }),
    ).toBeInTheDocument();

    await user.click(within(appNav).getByRole("link", { name: "Wardrobes" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Wardrobes" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      appPaths.appWardrobes,
    );

    await user.click(
      within(getAppNav()).getByRole("link", { name: "Virtual Try On" }),
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "Virtual Try On" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Pick clothing items or an outfit, then a Virtual Profile/,
      ),
    ).toBeInTheDocument();
  });

  it("opens Upgrade from the sidebar on the existing pricing page", async () => {
    const user = userEvent.setup();
    renderDashboard();

    const upgradeLink = within(getAppNav()).getByRole("link", {
      name: "Upgrade",
    });
    expect(upgradeLink).toHaveAttribute("href", appPaths.appPricing);
    expect(upgradeLink).not.toHaveAttribute("aria-current", "page");

    await user.click(upgradeLink);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Pricing" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      appPaths.appPricing,
    );
    expect(
      within(getAppNav()).getByRole("link", { name: "Upgrade" }),
    ).toHaveAttribute("aria-current", "page");
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

  it("opens Profile & Settings from the account menu", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Account menu" }));
    await user.click(
      screen.getByRole("menuitem", { name: "Profile & Settings" }),
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Profile & Settings",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      appPaths.appSettings,
    );
  });

  it("signs out from the top-bar account menu", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "Account menu" }));
    expect(
      screen.getByRole("menuitem", { name: "Signed in as user@example.com" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Profile & Settings" }),
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
    expect(
      within(appNav).getByRole("link", { name: "Upgrade" }),
    ).toHaveAttribute("href", appPaths.appPricing);

    await user.click(within(appNav).getByRole("link", { name: "Outfits" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Outfits" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "App" }),
    ).not.toBeInTheDocument();
  });

  it("places main content flush with the sidebar", () => {
    renderDashboard();

    expect(screen.getByTestId("dashboard-content")).toHaveStyle({
      marginLeft: "0px",
    });
  });

  it("puts signed-in screen content in one centred paper wrapper", () => {
    renderDashboard();

    const paper = screen.getByTestId(DASHBOARD_PAPER_TEST_ID);
    const sidebar = getAppNav();
    expect(screen.getByTestId("dashboard-content")).toContainElement(paper);
    expect(paper).toContainElement(
      screen.getByRole("heading", { level: 1, name: "Your closet" }),
    );
    expect(paper).not.toContainElement(sidebar);
    expect(screen.getAllByTestId(DASHBOARD_PAPER_TEST_ID)).toHaveLength(1);
    expect(screen.getByRole("contentinfo")).not.toEqual(paper);
    expect(paper.contains(screen.getByRole("contentinfo"))).toBe(false);
  });

  it("keeps Terms, Privacy, and Contact in the dashboard footer", () => {
    renderDashboard();

    const footer = screen.getByRole("contentinfo");
    const legalNav = within(footer).getByRole("navigation", { name: "Legal" });
    expect(
      within(legalNav).getByRole("link", { name: "Terms of Service" }),
    ).toHaveAttribute("href", appPaths.terms);
    expect(
      within(legalNav).getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", appPaths.privacy);
    expect(
      within(legalNav).getByRole("link", { name: "Contact us" }),
    ).toHaveAttribute("href", appPaths.contact);
    expect(
      within(screen.getByRole("banner")).queryByRole("link", {
        name: "Terms of Service",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("banner"))
        .getByRole("link", { name: "Pocket Closet home" })
        .querySelector("img"),
    ).toHaveAttribute("src", LOGO_PATH);
  });
});
