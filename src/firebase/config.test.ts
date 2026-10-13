import { beforeEach, describe, expect, it, vi } from "vitest";

const firebaseAppMocks = vi.hoisted(() => ({
  apps: [] as unknown[],
  app: { name: "[DEFAULT]" },
  initializeApp: vi.fn(),
  getApps: vi.fn(),
  getApp: vi.fn(),
  getAuth: vi.fn(),
}));

vi.mock("firebase/app", () => ({
  initializeApp: firebaseAppMocks.initializeApp,
  getApps: firebaseAppMocks.getApps,
  getApp: firebaseAppMocks.getApp,
}));

vi.mock("firebase/auth", () => ({
  getAuth: firebaseAppMocks.getAuth,
}));

vi.mock("../config/env", () => ({
  getFirebaseWebConfig: () => ({
    apiKey: "test-api-key",
    authDomain: "test.firebaseapp.com",
    projectId: "test-project",
    storageBucket: "test-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc",
  }),
}));

import { getFirebaseApp, getFirebaseAuth } from "./config";

describe("firebase config", () => {
  beforeEach(() => {
    firebaseAppMocks.apps = [];
    firebaseAppMocks.initializeApp.mockReturnValue(firebaseAppMocks.app);
    firebaseAppMocks.getApps.mockImplementation(() => firebaseAppMocks.apps);
    firebaseAppMocks.getApp.mockReturnValue(firebaseAppMocks.app);
    firebaseAppMocks.getAuth.mockReturnValue({ currentUser: null });
  });

  it("initialises the public web app once", () => {
    const first = getFirebaseApp();
    firebaseAppMocks.apps = [firebaseAppMocks.app];
    const second = getFirebaseApp();

    expect(first).toBe(firebaseAppMocks.app);
    expect(second).toBe(firebaseAppMocks.app);
    expect(firebaseAppMocks.initializeApp).toHaveBeenCalledTimes(1);
    expect(firebaseAppMocks.initializeApp).toHaveBeenCalledWith({
      apiKey: "test-api-key",
      authDomain: "test.firebaseapp.com",
      projectId: "test-project",
      storageBucket: "test-project.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abc",
    });
  });

  it("returns Auth from the initialised app", () => {
    const auth = getFirebaseAuth();
    expect(firebaseAppMocks.getAuth).toHaveBeenCalledWith(firebaseAppMocks.app);
    expect(auth).toEqual({ currentUser: null });
  });
});
