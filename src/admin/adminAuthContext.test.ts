import { describe, expect, it } from "vitest";
import {
  isAdminClaim,
  resolveAdminGate,
  type AdminAuthState,
} from "./adminAuthContext";

const baseState = (): AdminAuthState => ({
  configured: true,
  loading: false,
  user: { id: "user-1", email: "ops@example.com" },
  admin: true,
  apiForbidden: false,
});

describe("isAdminClaim", () => {
  it("accepts only a boolean true claim", () => {
    expect(isAdminClaim(true)).toBe(true);
    expect(isAdminClaim(false)).toBe(false);
    expect(isAdminClaim("true")).toBe(false);
    expect(isAdminClaim(1)).toBe(false);
  });
});

describe("resolveAdminGate", () => {
  it("returns unconfigured when Firebase web config is missing", () => {
    expect(
      resolveAdminGate({
        ...baseState(),
        configured: false,
        user: null,
        admin: false,
      }),
    ).toBe("unconfigured");
  });

  it("returns loading while the session is resolving", () => {
    expect(
      resolveAdminGate({
        ...baseState(),
        loading: true,
        user: null,
        admin: false,
      }),
    ).toBe("loading");
  });

  it("returns signed_out when there is no user", () => {
    expect(
      resolveAdminGate({
        ...baseState(),
        user: null,
        admin: false,
      }),
    ).toBe("signed_out");
  });

  it("returns not_authorised for a signed-in non-admin", () => {
    expect(
      resolveAdminGate({
        ...baseState(),
        admin: false,
      }),
    ).toBe("not_authorised");
  });

  it("returns not_authorised when the API reports forbidden", () => {
    expect(
      resolveAdminGate({
        ...baseState(),
        apiForbidden: true,
      }),
    ).toBe("not_authorised");
  });

  it("returns ready for an admin session", () => {
    expect(resolveAdminGate(baseState())).toBe("ready");
  });
});
