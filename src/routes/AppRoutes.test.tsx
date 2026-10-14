import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getApps } from "firebase/app";
import { useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../test/renderWithProviders";
import { AppRoutes } from "./AppRoutes";
import { appPaths, getAppPath, getSharePath } from "./paths";

const authProviderMocks = vi.hoisted(() => ({
  signInWithGoogle: vi.fn(),
  signInWithApple: vi.fn(),
  signInWithEmail: vi.fn(),
  registerWithEmail: vi.fn(),
  sendPasswordReset: vi.fn(),
  signOutUser: vi.fn(),
  getIdToken: vi.fn(),
}));

vi.mock("../auth/authProviders", () => authProviderMocks);

const RouteLocation = () => {
  const location = useLocation();
  return (
    <div data-testid="route-location">{`${location.pathname}${location.search}`}</div>
  );
};

const expectLegalFooterLinks = () => {
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
};

const expectHeaderHasNoLegalLinks = () => {
  const header = screen.getByRole("banner");
  expect(
    within(header).queryByRole("link", { name: "Terms of Service" }),
  ).not.toBeInTheDocument();
  expect(
    within(header).queryByRole("link", { name: "Privacy Policy" }),
  ).not.toBeInTheDocument();
  expect(
    within(header).queryByRole("link", { name: "Contact us" }),
  ).not.toBeInTheDocument();
};

const renderAppRoutes = (
  route?: string,
  auth?: { user?: { id: string } | null; loading?: boolean },
) => {
  return renderWithProviders(
    <>
      <AppRoutes />
      <RouteLocation />
    </>,
    { route, auth },
  );
};

describe("AppRoutes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authProviderMocks.getIdToken.mockResolvedValue("test-id-token");
    authProviderMocks.signOutUser.mockResolvedValue(undefined);
  });

  it("renders public pages without auth and without initialising Firebase", () => {
    const publicRoutes = [
      appPaths.home,
      appPaths.terms,
      appPaths.privacy,
      appPaths.contact,
    ];

    publicRoutes.forEach((route) => {
      const { unmount } = renderAppRoutes(route);
      expect(getApps()).toHaveLength(0);
      unmount();
    });
  });

  it("renders the landing page at / without auth", () => {
    renderAppRoutes(appPaths.home);

    expect(
      screen.getByRole("heading", {
        name: "Your closet, beautifully organized",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
    expectHeaderHasNoLegalLinks();
    expectLegalFooterLinks();
    expect(getApps()).toHaveLength(0);
  });

  it("renders Terms of Service at /terms", () => {
    renderAppRoutes(appPaths.terms);

    expect(
      screen.getByRole("heading", { level: 1, name: "Terms of Service" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Acceptable use" }),
    ).toBeInTheDocument();
    expect(getApps()).toHaveLength(0);
  });

  it("renders Contact us at /contact", () => {
    renderAppRoutes(appPaths.contact);

    expect(
      screen.getByRole("heading", { level: 1, name: "Contact us" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: "Contact form" }),
    ).toBeInTheDocument();
    expect(getApps()).toHaveLength(0);
  });

  it("renders Report a bug at /contact?type=bug", () => {
    renderAppRoutes("/contact?type=bug");

    expect(
      screen.getByRole("heading", { level: 1, name: "Report a bug" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Subject" })).toHaveValue(
      "Report a bug",
    );
    expect(getApps()).toHaveLength(0);
  });

  it("renders Privacy Policy at /privacy", () => {
    renderAppRoutes(appPaths.privacy);

    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Children’s privacy" }),
    ).toBeInTheDocument();
    expect(getApps()).toHaveLength(0);
  });

  it("opens the create-account view from /login?mode=signup", async () => {
    renderAppRoutes(`${appPaths.login}?mode=signup`);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Create account" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: "Create account form" }),
    ).toBeInTheDocument();
  });

  it("shows Dashboard in the landing header for a signed-in visitor", () => {
    renderAppRoutes(appPaths.home, { user: { id: "user-1" } });

    const header = screen.getByRole("banner");
    expect(
      within(header).getByRole("link", { name: "Dashboard" }),
    ).toHaveAttribute("href", appPaths.app);
    expect(
      within(header).queryByRole("link", { name: "Log in" }),
    ).not.toBeInTheDocument();
    expect(getApps()).toHaveLength(0);
  });

  it("shows footer legal links on landing, login, and dashboard", async () => {
    const { unmount: unmountLanding } = renderAppRoutes(appPaths.home);
    expectHeaderHasNoLegalLinks();
    expectLegalFooterLinks();
    unmountLanding();

    const { unmount: unmountLogin } = renderAppRoutes(appPaths.login);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeInTheDocument();
    expectHeaderHasNoLegalLinks();
    expectLegalFooterLinks();
    unmountLogin();

    renderAppRoutes(appPaths.app, { user: { id: "user-1" } });
    expect(
      await screen.findByRole("heading", { level: 1, name: "Your closet" }),
    ).toBeInTheDocument();
    expectHeaderHasNoLegalLinks();
    expectLegalFooterLinks();
  });

  it("renders the public login page at /login without auth", async () => {
    renderAppRoutes(appPaths.login);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
    expectHeaderHasNoLegalLinks();
    expectLegalFooterLinks();
  });

  it("navigates from the landing footer to legal and contact pages", async () => {
    const user = userEvent.setup();
    renderAppRoutes();

    expect(
      screen.getByRole("heading", {
        name: "Your closet, beautifully organized",
      }),
    ).toBeInTheDocument();

    await user.click(
      within(screen.getByRole("navigation", { name: "Legal" })).getByRole(
        "link",
        { name: "Terms of Service" },
      ),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Terms of Service" }),
    ).toBeInTheDocument();

    await user.click(
      within(screen.getByRole("navigation", { name: "Legal" })).getByRole(
        "link",
        { name: "Privacy Policy" },
      ),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeInTheDocument();

    await user.click(
      within(screen.getByRole("navigation", { name: "Legal" })).getByRole(
        "link",
        { name: "Contact us" },
      ),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Contact us" }),
    ).toBeInTheDocument();
  });

  it("renders the public share preview route", async () => {
    renderAppRoutes(getSharePath("shr_abcdefghijklmnopqrstu"));

    expect(
      await screen.findByRole("heading", {
        name: "Open this look in Pocket Closet",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Couldn't load this share" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Pocket Closet" }),
    ).toBeInTheDocument();
  });

  it("redirects a signed-out user from /app to /login and preserves the intended path", async () => {
    renderAppRoutes(appPaths.app);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      "/login?next=%2Fapp",
    );
  });

  it("redirects a signed-out user from a nested /app path to /login", async () => {
    renderAppRoutes(getAppPath("x"));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      "/login?next=%2Fapp%2Fx",
    );
  });

  it("renders /app for a signed-in user without the landing chrome", async () => {
    renderAppRoutes(appPaths.app, { user: { id: "user-1" } });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Your closet" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(appPaths.app);
    expect(
      screen.getByRole("navigation", { name: "App" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Account menu" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Primary" }),
    ).not.toBeInTheDocument();
    expectHeaderHasNoLegalLinks();
    expectLegalFooterLinks();
  });

  it("renders Profile & Settings and redirects /app/plan there", async () => {
    const { unmount } = renderAppRoutes(appPaths.appSettings, {
      user: { id: "user-1" },
    });

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Profile & Settings",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      appPaths.appSettings,
    );
    expect(
      screen.queryByRole("link", { name: "Plan" }),
    ).not.toBeInTheDocument();
    unmount();

    renderAppRoutes("/app/plan", { user: { id: "user-1" } });
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

  it("renders Inbox at /app/inbox", async () => {
    renderAppRoutes(appPaths.appInbox, { user: { id: "user-1" } });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Inbox" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      appPaths.appInbox,
    );
  });

  it("renders a nested /app path for a signed-in user", async () => {
    renderAppRoutes(appPaths.appWardrobes, { user: { id: "user-1" } });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Wardrobes" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      appPaths.appWardrobes,
    );
    expect(
      screen.getByRole("navigation", { name: "App" }),
    ).toBeInTheDocument();
  });

  it("renders wardrobe and item detail routes for a signed-in user", async () => {
    const { unmount } = renderAppRoutes("/app/wardrobes/wd_weekend01", {
      user: { id: "user-1" },
    });

    expect(screen.getByTestId("route-location")).toHaveTextContent(
      "/app/wardrobes/wd_weekend01",
    );
    expect(
      await screen.findByRole("heading", { level: 1 }),
    ).toBeInTheDocument();
    unmount();

    renderAppRoutes("/app/items/item_navytee01", { user: { id: "user-1" } });
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      "/app/items/item_navytee01",
    );
    expect(
      await screen.findByRole("heading", { level: 1 }),
    ).toBeInTheDocument();
  });

  it("keeps public pages on the landing shell without dashboard chrome", () => {
    renderAppRoutes(appPaths.home);

    expect(
      screen.getByRole("heading", {
        name: "Your closet, beautifully organized",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "App" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Account menu" }),
    ).not.toBeInTheDocument();
  });

  it("waits on a loading auth state instead of redirecting /app", () => {
    renderAppRoutes(appPaths.app, { loading: true });

    expect(
      screen.getByRole("status", { name: "Checking sign-in status" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(appPaths.app);
    expect(
      screen.queryByRole("heading", { level: 1, name: "Sign in" }),
    ).not.toBeInTheDocument();
  });
});
