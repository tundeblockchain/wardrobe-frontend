import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from "./passwordValidation";

describe("passwordValidation", () => {
  it("validates email addresses", () => {
    expect(validateEmail("")).toBe("Enter your email address.");
    expect(validateEmail("   ")).toBe("Enter your email address.");
    expect(validateEmail("not-an-email")).toBe("Enter a valid email address.");
    expect(validateEmail("user@example.com")).toBeUndefined();
  });

  it("requires a minimum password length", () => {
    expect(validatePassword("")).toBe("Enter a password.");
    expect(validatePassword("short")).toBe(
      `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
    expect(validatePassword("longenough")).toBeUndefined();
  });

  it("requires matching password confirmation", () => {
    expect(validatePasswordConfirmation("longenough", "")).toBe(
      "Confirm your password.",
    );
    expect(validatePasswordConfirmation("longenough", "different")).toBe(
      "Passwords do not match.",
    );
    expect(validatePasswordConfirmation("longenough", "longenough")).toBeUndefined();
  });
});
