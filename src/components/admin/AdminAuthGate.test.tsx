import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminAuthProvider } from "../../admin/AdminAuthProvider";
import type { AdminAuthState } from "../../admin/adminAuthContext";
import { renderWithProviders } from "../../test/renderWithProviders";
import { AdminAuthGate } from "./AdminAuthGate";

vi.mock("../../admin/adminAuthProviders", () => ({
  signInAdminWithGoogle: vi.fn(),
  signInAdminWithEmail: vi.fn(),
  signOutAdmin: vi.fn(),
  getAdminIdToken: vi.fn(),
  isAdminClaim: (value: unknown) => value === true,
}));

const renderGate = (state: AdminAuthState) => {
  return renderWithProviders(
    <AdminAuthProvider initialState={state}>
      <AdminAuthGate>
        <p>Inbox ready</p>
      </AdminAuthGate>
    </AdminAuthProvider>,
  );
};

describe("AdminAuthGate", () => {
  it("shows admin not configured when Firebase web config is missing", () => {
    renderGate({
      configured: false,
      loading: false,
      user: null,
      admin: false,
      apiForbidden: false,
    });

    expect(
      screen.getByRole("heading", { name: "Admin is not configured" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Inbox ready")).not.toBeInTheDocument();
  });

  it("shows the sign-in screen when signed out", () => {
    renderGate({
      configured: true,
      loading: false,
      user: null,
      admin: false,
      apiForbidden: false,
    });

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign in with email" }),
    ).toBeInTheDocument();
  });

  it("shows not authorised with sign-out for a signed-in non-admin", async () => {
    const user = userEvent.setup();
    renderGate({
      configured: true,
      loading: false,
      user: { id: "user-1", email: "member@example.com" },
      admin: false,
      apiForbidden: false,
    });

    expect(
      screen.getByRole("heading", { name: "Not authorised" }),
    ).toBeInTheDocument();
    expect(screen.getByText("member@example.com")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("treats an API forbidden flag as not authorised", () => {
    renderGate({
      configured: true,
      loading: false,
      user: { id: "admin-1", email: "ops@example.com" },
      admin: true,
      apiForbidden: true,
    });

    expect(
      screen.getByRole("heading", { name: "Not authorised" }),
    ).toBeInTheDocument();
  });

  it("renders children for an authorised operator", () => {
    renderGate({
      configured: true,
      loading: false,
      user: { id: "admin-1", email: "ops@example.com" },
      admin: true,
      apiForbidden: false,
    });

    expect(screen.getByText("Inbox ready")).toBeInTheDocument();
  });
});
