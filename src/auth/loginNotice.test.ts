import { afterEach, describe, expect, it } from "vitest";
import {
  LOGIN_NOTICE_STORAGE_KEY,
  consumeLoginNotice,
  setLoginNotice,
} from "./loginNotice";

describe("loginNotice", () => {
  afterEach(() => {
    sessionStorage.removeItem(LOGIN_NOTICE_STORAGE_KEY);
  });

  it("stores and consumes a login notice once", () => {
    setLoginNotice("Couldn't delete this account. Sign in and try again.");

    expect(sessionStorage.getItem(LOGIN_NOTICE_STORAGE_KEY)).toBe(
      "Couldn't delete this account. Sign in and try again.",
    );
    expect(consumeLoginNotice()).toBe(
      "Couldn't delete this account. Sign in and try again.",
    );
    expect(consumeLoginNotice()).toBe("");
    expect(sessionStorage.getItem(LOGIN_NOTICE_STORAGE_KEY)).toBeNull();
  });

  it("ignores blank notices", () => {
    setLoginNotice("   ");
    expect(consumeLoginNotice()).toBe("");
  });
});
