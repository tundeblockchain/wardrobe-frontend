import { describe, expect, it } from "vitest";
import { DEFAULT_AUTH_ERROR_MESSAGE, getAuthErrorMessage } from "./authErrors";

describe("getAuthErrorMessage", () => {
  it("maps known Firebase Auth error codes to friendly messages", () => {
    expect(getAuthErrorMessage({ code: "auth/invalid-email" })).toBe(
      "Enter a valid email address.",
    );
    expect(getAuthErrorMessage({ code: "auth/invalid-credential" })).toBe(
      "Incorrect email or password.",
    );
    expect(getAuthErrorMessage({ code: "auth/email-already-in-use" })).toBe(
      "An account already exists with that email.",
    );
    expect(getAuthErrorMessage({ code: "auth/popup-closed-by-user" })).toBe(
      "Sign-in was cancelled.",
    );
    expect(
      getAuthErrorMessage({
        code: "auth/account-exists-with-different-credential",
      }),
    ).toBe("An account already exists with a different sign-in method.");
  });

  it("returns a generic message for unknown or missing codes", () => {
    expect(getAuthErrorMessage({ code: "auth/mystery" })).toBe(
      DEFAULT_AUTH_ERROR_MESSAGE,
    );
    expect(getAuthErrorMessage(new Error("boom"))).toBe(
      DEFAULT_AUTH_ERROR_MESSAGE,
    );
    expect(getAuthErrorMessage("nope")).toBe(DEFAULT_AUTH_ERROR_MESSAGE);
  });
});
