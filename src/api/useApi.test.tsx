import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("../config/env", async () => {
  const actual = await vi.importActual<typeof import("../config/env")>(
    "../config/env",
  );
  return {
    ...actual,
    getPublicAppEnv: (source?: import("../config/env").EnvSource) => ({
      ...actual.getPublicAppEnv(source),
      apiBaseUrl: "https://api.example.com",
    }),
  };
});

import { renderWithProviders } from "../test/renderWithProviders";
import { useApi } from "./useApi";

const meBody = {
  uid: "user-1",
  email: "ada@example.com",
  store: "APP_STORE",
};

const GetMeProbe = () => {
  const { getMe } = useApi();

  const handleClick = () => {
    void getMe();
  };

  return (
    <button type="button" onClick={handleClick}>
      load me
    </button>
  );
};

describe("useApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authProviderMocks.getIdToken.mockResolvedValue("hook-token");
    authProviderMocks.signOutUser.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the signed-in ID token for getMe()", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => meBody,
    });
    vi.stubGlobal("fetch", fetchImpl);
    const user = userEvent.setup();

    renderWithProviders(<GetMeProbe />, {
      auth: { user: { id: "user-1" } },
    });

    await user.click(screen.getByRole("button", { name: "load me" }));

    await waitFor(() => {
      expect(authProviderMocks.getIdToken).toHaveBeenCalledWith(false);
      expect(fetchImpl).toHaveBeenCalled();
    });
    const [, options] = fetchImpl.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer hook-token");
  });
});
