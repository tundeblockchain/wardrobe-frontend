import { afterEach, describe, expect, it } from "vitest";
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  DENIED_CONSENT_FLAGS,
  clearConsent,
  clearTrackingCookies,
  getConsent,
  getCookieDomainCandidates,
  hasAnalyticsConsent,
  hasConsentChoice,
  hasMarketingConsent,
  isTrackingCookieName,
  isWithdrawingConsent,
  normalizeConsentFlags,
  parseConsentChoice,
  readCookieNames,
  writeConsent,
} from "./consent";

describe("consent storage", () => {
  afterEach(() => {
    clearConsent();
  });

  it("returns null when nothing is stored", () => {
    expect(getConsent()).toBeNull();
    expect(hasConsentChoice()).toBe(false);
    expect(hasAnalyticsConsent()).toBe(false);
    expect(hasMarketingConsent()).toBe(false);
  });

  it("persists flags, timestamp, and version under pc_consent_v1", () => {
    const choice = writeConsent({ analytics: true, marketing: false }, 1_700_000_000_000);

    expect(choice).toEqual({
      analytics: true,
      marketing: false,
      ts: 1_700_000_000_000,
      version: CONSENT_VERSION,
    });
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toContain(
      '"analytics":true',
    );
    expect(getConsent()).toEqual(choice);
    expect(hasAnalyticsConsent()).toBe(true);
    expect(hasMarketingConsent()).toBe(false);
  });

  it("re-asks when the stored version does not match", () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        analytics: true,
        marketing: true,
        ts: 1,
        version: CONSENT_VERSION - 1,
      }),
    );

    expect(parseConsentChoice(window.localStorage.getItem(CONSENT_STORAGE_KEY))).toBeNull();
    expect(getConsent()).toBeNull();
    expect(hasConsentChoice()).toBe(false);
  });

  it("ignores invalid JSON and incomplete objects", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "{not-json");
    expect(getConsent()).toBeNull();

    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ analytics: true }),
    );
    expect(getConsent()).toBeNull();
  });
});

describe("normalizeConsentFlags", () => {
  it("treats missing, undefined, and invalid stored consent as denied", () => {
    expect(normalizeConsentFlags(undefined)).toEqual(DENIED_CONSENT_FLAGS);
    expect(normalizeConsentFlags(null)).toEqual(DENIED_CONSENT_FLAGS);
    expect(normalizeConsentFlags("accept")).toEqual(DENIED_CONSENT_FLAGS);
    expect(normalizeConsentFlags({ analytics: true })).toEqual(DENIED_CONSENT_FLAGS);
    expect(
      normalizeConsentFlags({ analytics: "true", marketing: true }),
    ).toEqual(DENIED_CONSENT_FLAGS);
    expect(normalizeConsentFlags(getConsent())).toEqual(DENIED_CONSENT_FLAGS);
  });

  it("keeps explicit boolean flags including a stored choice", () => {
    const stored = writeConsent({ analytics: true, marketing: false }, 1);
    expect(normalizeConsentFlags(stored)).toEqual({
      analytics: true,
      marketing: false,
    });
    expect(
      normalizeConsentFlags({ analytics: false, marketing: true }),
    ).toEqual({ analytics: false, marketing: true });
    clearConsent();
  });
});

describe("isWithdrawingConsent", () => {
  it("is false on the first choice, including reject all", () => {
    expect(
      isWithdrawingConsent(null, { analytics: false, marketing: false }),
    ).toBe(false);
  });

  it("is true when a previously granted category is turned off", () => {
    const previous = writeConsent({ analytics: true, marketing: true }, 1);
    expect(
      isWithdrawingConsent(previous, { analytics: false, marketing: true }),
    ).toBe(true);
    expect(
      isWithdrawingConsent(previous, { analytics: true, marketing: false }),
    ).toBe(true);
    expect(
      isWithdrawingConsent(previous, { analytics: false, marketing: false }),
    ).toBe(true);
    expect(
      isWithdrawingConsent(previous, { analytics: true, marketing: true }),
    ).toBe(false);
    clearConsent();
  });
});

describe("tracking cookie clearing", () => {
  it("recognizes GA, Meta, and TikTok cookies including _ga_* prefixes", () => {
    expect(isTrackingCookieName("_ga")).toBe(true);
    expect(isTrackingCookieName("_ga_ABC123")).toBe(true);
    expect(isTrackingCookieName("_gid")).toBe(true);
    expect(isTrackingCookieName("_fbp")).toBe(true);
    expect(isTrackingCookieName("_fbc")).toBe(true);
    expect(isTrackingCookieName("_ttp")).toBe(true);
    expect(isTrackingCookieName("_gcl_au")).toBe(true);
    expect(isTrackingCookieName("ttcsid")).toBe(true);
    expect(isTrackingCookieName("ttcsid_abc")).toBe(true);
    expect(isTrackingCookieName("session")).toBe(false);
    expect(isTrackingCookieName("firebase-heartbeat")).toBe(false);
  });

  it("deletes matching first-party cookies", () => {
    document.cookie = "_ga=GA1.1.test; path=/";
    document.cookie = "_ga_XXXX=session; path=/";
    document.cookie = "_gid=id; path=/";
    document.cookie = "_fbp=fb.1; path=/";
    document.cookie = "_fbc=fb.1.c; path=/";
    document.cookie = "_ttp=tt; path=/";
    document.cookie = "keep_me=yes; path=/";

    const cleared = clearTrackingCookies(document, "localhost");
    const remaining = readCookieNames(document.cookie);

    expect(cleared).toEqual(
      expect.arrayContaining(["_ga", "_ga_XXXX", "_gid", "_fbp", "_fbc", "_ttp"]),
    );
    expect(remaining).not.toContain("_ga");
    expect(remaining).not.toContain("_ga_XXXX");
    expect(remaining).not.toContain("_gid");
    expect(remaining).not.toContain("_fbp");
    expect(remaining).not.toContain("_fbc");
    expect(remaining).not.toContain("_ttp");
    expect(remaining).toContain("keep_me");
  });

  it("includes the current host and parent domain when building delete candidates", () => {
    expect(getCookieDomainCandidates("www.pocketcloset.app")).toEqual(
      expect.arrayContaining([
        undefined,
        "www.pocketcloset.app",
        ".www.pocketcloset.app",
        "pocketcloset.app",
        ".pocketcloset.app",
      ]),
    );
  });
});
