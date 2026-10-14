import { describe, expect, it } from "vitest";
import {
  getSignedInWithLabel,
  mapAuthProviderId,
} from "./authProviderLabel";

describe("authProviderLabel", () => {
  it("maps Firebase providerData ids to Google, Apple, or Email", () => {
    expect(mapAuthProviderId("google.com")).toBe("google");
    expect(mapAuthProviderId("apple.com")).toBe("apple");
    expect(mapAuthProviderId("password")).toBe("email");
    expect(mapAuthProviderId("twitter.com")).toBeUndefined();
    expect(mapAuthProviderId(undefined)).toBeUndefined();
  });

  it("builds the Signed in with label", () => {
    expect(getSignedInWithLabel("google")).toBe("Signed in with Google");
    expect(getSignedInWithLabel("apple")).toBe("Signed in with Apple");
    expect(getSignedInWithLabel("email")).toBe("Signed in with Email");
    expect(getSignedInWithLabel(undefined)).toBe("Signed in");
  });
});
