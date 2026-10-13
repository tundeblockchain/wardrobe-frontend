import { beforeEach, describe, expect, it, vi } from "vitest";

const firebaseAuthMocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: firebaseAuthMocks.onAuthStateChanged,
}));

vi.mock("../firebase/config", () => ({
  getFirebaseAuth: () => ({ currentUser: null }),
}));

import { subscribeToFirebaseAuth } from "./firebaseSession";

describe("firebaseSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    firebaseAuthMocks.onAuthStateChanged.mockReturnValue(vi.fn());
  });

  it("resolves signed-out without loading Firebase when web config is missing", async () => {
    const setAuthUser = vi.fn();
    const setAuthLoading = vi.fn();

    const unsubscribe = await subscribeToFirebaseAuth({
      setAuthUser,
      setAuthLoading,
    });

    expect(setAuthUser).toHaveBeenCalledWith(null);
    expect(setAuthLoading).toHaveBeenCalledWith(false);
    expect(firebaseAuthMocks.onAuthStateChanged).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("subscribes lazily when Firebase web config is set", async () => {
    vi.stubEnv("VITE_FIREBASE_API_KEY", "test-api-key");
    vi.stubEnv("VITE_FIREBASE_AUTH_DOMAIN", "test.firebaseapp.com");
    vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "test-project");
    vi.stubEnv("VITE_FIREBASE_STORAGE_BUCKET", "test-project.appspot.com");
    vi.stubEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "123456789");
    vi.stubEnv("VITE_FIREBASE_APP_ID", "1:123456789:web:abc");

    const setAuthUser = vi.fn();
    const setAuthLoading = vi.fn();

    await subscribeToFirebaseAuth({
      setAuthUser,
      setAuthLoading,
    });

    expect(setAuthLoading).toHaveBeenCalledWith(true);
    expect(firebaseAuthMocks.onAuthStateChanged).toHaveBeenCalledTimes(1);
  });
});
