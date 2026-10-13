import { beforeEach, describe, expect, it, vi } from "vitest";

const firebaseAuthMocks = vi.hoisted(() => {
  const addScope = vi.fn();

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
    signInWithPopup: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    signOut: vi.fn(),
    currentUser: {
      getIdToken: vi.fn(),
    },
  };
});

vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: firebaseAuthMocks.GoogleAuthProvider,
  OAuthProvider: firebaseAuthMocks.OAuthProvider,
  signInWithPopup: firebaseAuthMocks.signInWithPopup,
  signInWithEmailAndPassword: firebaseAuthMocks.signInWithEmailAndPassword,
  createUserWithEmailAndPassword:
    firebaseAuthMocks.createUserWithEmailAndPassword,
  sendPasswordResetEmail: firebaseAuthMocks.sendPasswordResetEmail,
  signOut: firebaseAuthMocks.signOut,
}));

vi.mock("../firebase/config", () => ({
  getFirebaseAuth: () => ({
    currentUser: firebaseAuthMocks.currentUser,
  }),
}));

import {
  APPLE_AUTH_PROVIDER_ID,
  getIdToken,
  registerWithEmail,
  sendPasswordReset,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
} from "./authProviders";

describe("authProviders", () => {
  const auth = { currentUser: firebaseAuthMocks.currentUser };

  beforeEach(() => {
    vi.clearAllMocks();
    firebaseAuthMocks.currentUser.getIdToken.mockResolvedValue("id-token");
    firebaseAuthMocks.signInWithPopup.mockResolvedValue({});
    firebaseAuthMocks.signInWithEmailAndPassword.mockResolvedValue({});
    firebaseAuthMocks.createUserWithEmailAndPassword.mockResolvedValue({});
    firebaseAuthMocks.sendPasswordResetEmail.mockResolvedValue(undefined);
    firebaseAuthMocks.signOut.mockResolvedValue(undefined);
  });

  it("signs in with Google via a popup", async () => {
    await signInWithGoogle();

    expect(firebaseAuthMocks.signInWithPopup).toHaveBeenCalledTimes(1);
    const [passedAuth, provider] =
      firebaseAuthMocks.signInWithPopup.mock.calls[0] ?? [];
    expect(passedAuth).toEqual(auth);
    expect(provider).toBeInstanceOf(firebaseAuthMocks.GoogleAuthProvider);
  });

  it("signs in with Apple using email and name scopes", async () => {
    await signInWithApple();

    expect(firebaseAuthMocks.addScope).toHaveBeenCalledWith("email");
    expect(firebaseAuthMocks.addScope).toHaveBeenCalledWith("name");
    const [, provider] = firebaseAuthMocks.signInWithPopup.mock.calls[0] ?? [];
    expect(provider).toBeInstanceOf(firebaseAuthMocks.OAuthProvider);
    expect((provider as { providerId: string }).providerId).toBe(
      APPLE_AUTH_PROVIDER_ID,
    );
  });

  it("signs in and registers with email/password and can reset or sign out", async () => {
    await signInWithEmail(" user@example.com ", "secret123");
    expect(firebaseAuthMocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      "user@example.com",
      "secret123",
    );

    await registerWithEmail(" user@example.com ", "secret123");
    expect(
      firebaseAuthMocks.createUserWithEmailAndPassword,
    ).toHaveBeenCalledWith(auth, "user@example.com", "secret123");

    await sendPasswordReset(" user@example.com ");
    expect(firebaseAuthMocks.sendPasswordResetEmail).toHaveBeenCalledWith(
      auth,
      "user@example.com",
    );

    await signOutUser();
    expect(firebaseAuthMocks.signOut).toHaveBeenCalledWith(auth);

    await expect(getIdToken(true)).resolves.toBe("id-token");
    expect(firebaseAuthMocks.currentUser.getIdToken).toHaveBeenCalledWith(true);
  });
});
