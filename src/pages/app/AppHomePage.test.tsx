import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { renderWithProviders } from "../../test/renderWithProviders";
import { ProtectedRoute } from "../../routes/ProtectedRoute";
import { AppHomePage } from "./AppHomePage";

const RouteLocation = () => {
  const location = useLocation();
  return (
    <div data-testid="route-location">{`${location.pathname}${location.search}`}</div>
  );
};

describe("AppHomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authProviderMocks.signOutUser.mockResolvedValue(undefined);
  });

  it("renders the signed-in app home placeholder", () => {
    renderWithProviders(<AppHomePage />, {
      auth: { user: { id: "user-1", email: "user@example.com" } },
    });

    expect(
      screen.getByRole("heading", { level: 1, name: "Your closet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Closet tools will appear here in a later update/),
    ).toBeInTheDocument();
    expect(screen.getByText("Signed in as user@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("signs out and returns to login", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <Routes>
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppHomePage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<p>Sign in page</p>} />
        </Routes>
        <RouteLocation />
      </>,
      { route: "/app", auth: { user: { id: "user-1" } } },
    );

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(authProviderMocks.signOutUser).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Sign in page")).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent(
      "/login?next=%2Fapp",
    );
  });
});
