import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const firebaseAuthMocks = vi.hoisted(() => {
  const addScope = vi.fn();
  let authCallback:
    | ((user: { uid: string; email: string | null; displayName: string | null } | null) => void)
    | undefined;

  class GoogleAuthProvider {}
  class OAuthProvider {
    providerId: string;
    addScope = addScope;
    constructor(providerId: string) {
      this.providerId = providerId;
    }
  }

  return {
    addScope,
    GoogleAuthProvider,
    OAuthProvider,
    authCallback: {
      get current() {
        return authCallback;
      },
      set current(value) {
        authCallback = value;
      },
    },
    onAuthStateChanged: vi.fn((_auth, callback) => {
      authCallback = callback;
      callback(null);
      return vi.fn();
    }),
    signInWithPopup: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    signOut: vi.fn(),
  };
});

vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: firebaseAuthMocks.GoogleAuthProvider,
  OAuthProvider: firebaseAuthMocks.OAuthProvider,
  onAuthStateChanged: firebaseAuthMocks.onAuthStateChanged,
  signInWithPopup: firebaseAuthMocks.signInWithPopup,
  signInWithEmailAndPassword: firebaseAuthMocks.signInWithEmailAndPassword,
  createUserWithEmailAndPassword:
    firebaseAuthMocks.createUserWithEmailAndPassword,
  sendPasswordResetEmail: firebaseAuthMocks.sendPasswordResetEmail,
  signOut: firebaseAuthMocks.signOut,
}));

vi.mock("../firebase/config", () => ({
  getFirebaseAuth: () => ({ currentUser: null }),
}));

import { renderWithProviders } from "../test/renderWithProviders";
import { LoginPage } from "./LoginPage";

const RouteLocation = () => {
  const location = useLocation();
  return (
    <div data-testid="route-location">{`${location.pathname}${location.search}`}</div>
  );
};

const renderLoginRoute = (
  route = "/login",
  options: Parameters<typeof renderWithProviders>[1] = {},
) => {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<p>Signed-in app</p>} />
        <Route path="/app/x" element={<p>Signed-in nested app</p>} />
      </Routes>
      <RouteLocation />
    </>,
    { route, ...options },
  );
};

const stubFirebaseEnv = () => {
  vi.stubEnv("VITE_FIREBASE_API_KEY", "test-api-key");
  vi.stubEnv("VITE_FIREBASE_AUTH_DOMAIN", "test.firebaseapp.com");
  vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "test-project");
  vi.stubEnv("VITE_FIREBASE_STORAGE_BUCKET", "test-project.appspot.com");
  vi.stubEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "123456789");
  vi.stubEnv("VITE_FIREBASE_APP_ID", "1:123456789:web:abc");
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    firebaseAuthMocks.signInWithPopup.mockResolvedValue({});
    firebaseAuthMocks.signInWithEmailAndPassword.mockResolvedValue({});
    firebaseAuthMocks.onAuthStateChanged.mockImplementation((_auth, callback) => {
      firebaseAuthMocks.authCallback.current = callback;
      callback(null);
      return vi.fn();
    });
  });

  it("renders Google, Apple, email sign-in, create account, and forgot password", () => {
    renderLoginRoute();

    expect(
      screen.getByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Apple" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: "Email sign-in form" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create account" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Forgot password" }),
    ).toBeInTheDocument();
  });

  it("shows create account and forgot password without feature flags", async () => {
    const user = userEvent.setup();
    renderLoginRoute();

    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Create account" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: "Create account form" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to sign in" }));
    await user.click(screen.getByRole("button", { name: "Forgot password" }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Forgot password" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: "Forgot password form" }),
    ).toBeInTheDocument();
  });

  it("sends a signed-in user visiting /login to /app", async () => {
    renderLoginRoute("/login", { auth: { user: { id: "user-1" } } });

    expect(await screen.findByText("Signed-in app")).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent("/app");
  });

  it("redirects to the next path after Google sign-in", async () => {
    const user = userEvent.setup();
    stubFirebaseEnv();
    firebaseAuthMocks.signInWithPopup.mockImplementation(async () => {
      firebaseAuthMocks.authCallback.current?.({
        uid: "user-1",
        email: "user@example.com",
        displayName: "User",
      });
    });

    renderLoginRoute("/login?next=%2Fapp%2Fx", { liveAuth: true });

    await user.click(
      await screen.findByRole("button", { name: "Continue with Google" }),
    );

    expect(await screen.findByText("Signed-in nested app")).toBeInTheDocument();
    expect(screen.getByTestId("route-location")).toHaveTextContent("/app/x");
    expect(firebaseAuthMocks.signInWithPopup).toHaveBeenCalledTimes(1);
  });

  it("shows a friendly mapped auth error when Google sign-in fails", async () => {
    const user = userEvent.setup();
    stubFirebaseEnv();
    firebaseAuthMocks.signInWithPopup.mockRejectedValue({
      code: "auth/popup-closed-by-user",
    });

    renderLoginRoute("/login", { liveAuth: true });

    await user.click(
      await screen.findByRole("button", { name: "Continue with Google" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sign-in was cancelled.",
    );
    expect(screen.getByTestId("route-location")).toHaveTextContent("/login");
  });
});
