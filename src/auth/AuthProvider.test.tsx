import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

vi.mock("./authProviders", () => authProviderMocks);

import { renderWithProviders } from "../test/renderWithProviders";
import { useAuth } from "./useAuth";

const AuthStateProbe = () => {
  const { user, loading } = useAuth();
  return (
    <p>
      {loading ? "loading" : "ready"}:{user?.id ?? "signed-out"}
    </p>
  );
};

const AuthActionsProbe = () => {
  const {
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    registerWithEmail,
    sendPasswordReset,
    signOut,
    getIdToken,
  } = useAuth();

  const handleGoogleClick = () => {
    void signInWithGoogle();
  };
  const handleAppleClick = () => {
    void signInWithApple();
  };
  const handleEmailClick = () => {
    void signInWithEmail("user@example.com", "secret123");
  };
  const handleRegisterClick = () => {
    void registerWithEmail("user@example.com", "secret123");
  };
  const handleResetClick = () => {
    void sendPasswordReset("user@example.com");
  };
  const handleSignOutClick = () => {
    void signOut();
  };
  const handleTokenClick = () => {
    void getIdToken();
  };

  return (
    <div>
      <button type="button" onClick={handleGoogleClick}>
        google
      </button>
      <button type="button" onClick={handleAppleClick}>
        apple
      </button>
      <button type="button" onClick={handleEmailClick}>
        email
      </button>
      <button type="button" onClick={handleRegisterClick}>
        register
      </button>
      <button type="button" onClick={handleResetClick}>
        reset
      </button>
      <button type="button" onClick={handleSignOutClick}>
        sign-out
      </button>
      <button type="button" onClick={handleTokenClick}>
        token
      </button>
    </div>
  );
};

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authProviderMocks.signInWithGoogle.mockResolvedValue(undefined);
    authProviderMocks.signInWithApple.mockResolvedValue(undefined);
    authProviderMocks.signInWithEmail.mockResolvedValue(undefined);
    authProviderMocks.registerWithEmail.mockResolvedValue(undefined);
    authProviderMocks.sendPasswordReset.mockResolvedValue(undefined);
    authProviderMocks.signOutUser.mockResolvedValue(undefined);
    authProviderMocks.getIdToken.mockResolvedValue("id-token");
  });

  it("defaults to a signed-out, idle auth state", () => {
    renderWithProviders(<AuthStateProbe />);

    expect(screen.getByText("ready:signed-out")).toBeInTheDocument();
  });

  it("accepts a mocked signed-in user", () => {
    renderWithProviders(<AuthStateProbe />, {
      auth: { user: { id: "user-1" } },
    });

    expect(screen.getByText("ready:user-1")).toBeInTheDocument();
  });

  it("exposes Google, Apple, and email provider calls", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthActionsProbe />);

    await user.click(screen.getByRole("button", { name: "google" }));
    await user.click(screen.getByRole("button", { name: "apple" }));
    await user.click(screen.getByRole("button", { name: "email" }));
    await user.click(screen.getByRole("button", { name: "register" }));
    await user.click(screen.getByRole("button", { name: "reset" }));
    await user.click(screen.getByRole("button", { name: "sign-out" }));
    await user.click(screen.getByRole("button", { name: "token" }));

    expect(authProviderMocks.signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(authProviderMocks.signInWithApple).toHaveBeenCalledTimes(1);
    expect(authProviderMocks.signInWithEmail).toHaveBeenCalledWith(
      "user@example.com",
      "secret123",
    );
    expect(authProviderMocks.registerWithEmail).toHaveBeenCalledWith(
      "user@example.com",
      "secret123",
    );
    expect(authProviderMocks.sendPasswordReset).toHaveBeenCalledWith(
      "user@example.com",
    );
    expect(authProviderMocks.signOutUser).toHaveBeenCalledTimes(1);
    expect(authProviderMocks.getIdToken).toHaveBeenCalledWith(false);
  });
});
