import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../test/renderWithProviders";
import { AppRoutes } from "./AppRoutes";
import { appPaths, getAppPath, getSharePath } from "./paths";

const RouteLocation = () => {
  const location = useLocation();
  return (
    <div data-testid="route-location">{`${location.pathname}${location.search}`}</div>
  );
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
    expect(
      screen.getByRole("navigation", { name: "Legal" }),
    ).toBeInTheDocument();
  });

  it("renders Terms of Service at /terms", () => {
    renderAppRoutes(appPaths.terms);

    expect(
      screen.getByRole("heading", { level: 1, name: "Terms of Service" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Acceptable use" }),
    ).toBeInTheDocument();
  });

  it("renders Contact us at /contact", () => {
    renderAppRoutes(appPaths.contact);

    expect(
      screen.getByRole("heading", { level: 1, name: "Contact us" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: "Contact form" }),
    ).toBeInTheDocument();
  });

  it("renders Privacy Policy at /privacy", () => {
    renderAppRoutes(appPaths.privacy);

    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Children’s privacy" }),
    ).toBeInTheDocument();
  });

  it("renders the public login placeholder at /login without auth", async () => {
    renderAppRoutes(appPaths.login);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
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
      screen.queryByRole("navigation", { name: "Primary" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Legal" }),
    ).not.toBeInTheDocument();
  });

  it("renders a nested /app path for a signed-in user", async () => {
    renderAppRoutes(getAppPath("x"), { user: { id: "user-1" } });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Your closet" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      getAppPath("x"),
    );
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
