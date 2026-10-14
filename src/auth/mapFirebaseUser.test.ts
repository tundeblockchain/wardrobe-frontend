import { describe, expect, it } from "vitest";
import { mapFirebaseUser } from "./mapFirebaseUser";

describe("mapFirebaseUser", () => {
  it("copies the first Firebase providerData id onto the session user", () => {
    expect(
      mapFirebaseUser({
        uid: "user-1",
        email: "user@example.com",
        displayName: "Sample User",
        providerData: [{ providerId: "google.com" }],
      }),
    ).toEqual({
      id: "user-1",
      email: "user@example.com",
      displayName: "Sample User",
      provider: "google",
    });
    expect(
      mapFirebaseUser({
        uid: "user-2",
        email: "user@example.com",
        displayName: null,
        providerData: [{ providerId: "apple.com" }, { providerId: "password" }],
      }).provider,
    ).toBe("apple");
    expect(
      mapFirebaseUser({
        uid: "user-3",
        email: "user@example.com",
        displayName: null,
        providerData: [{ providerId: "password" }],
      }).provider,
    ).toBe("email");
    expect(
      mapFirebaseUser({
        uid: "user-4",
        email: null,
        displayName: null,
      }).provider,
    ).toBeUndefined();
  });
});
