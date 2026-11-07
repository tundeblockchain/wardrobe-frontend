export const CONSENT_STORAGE_KEY = "pc_consent_v1";
export const CONSENT_VERSION = 1;
export const COOKIE_PREFERENCES_EVENT = "wardrobe:cookie-preferences";

export type ConsentFlags = {
  analytics: boolean;
  marketing: boolean;
};

export type ConsentChoice = ConsentFlags & {
  ts: number;
  version: number;
};

export const TRACKING_COOKIE_EXACT_NAMES = [
  "_ga",
  "_gid",
  "_gat",
  "_gcl_au",
  "_gcl_aw",
  "_gcl_gb",
  "_fbp",
  "_fbc",
  "_ttp",
  "_tt_enable_cookie",
] as const;

export const TRACKING_COOKIE_PREFIXES = ["_ga_", "_gcl_", "ttcsid"] as const;

type ConsentListener = (choice: ConsentChoice | null) => void;

const consentListeners = new Set<ConsentListener>();

const isObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object";
};

const isConsentChoice = (value: unknown): value is ConsentChoice => {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.analytics === "boolean" &&
    typeof value.marketing === "boolean" &&
    typeof value.ts === "number" &&
    typeof value.version === "number"
  );
};

const getStorage = (): Storage | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

export const subscribeConsent = (listener: ConsentListener): (() => void) => {
  consentListeners.add(listener);
  return () => {
    consentListeners.delete(listener);
  };
};

export const notifyConsentListeners = (
  choice: ConsentChoice | null,
): void => {
  consentListeners.forEach((listener) => {
    listener(choice);
  });
};

export const openCookiePreferences = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT));
};

export const subscribeCookiePreferences = (
  listener: () => void,
): (() => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(COOKIE_PREFERENCES_EVENT, listener);
  return () => {
    window.removeEventListener(COOKIE_PREFERENCES_EVENT, listener);
  };
};

export const parseConsentChoice = (raw: string | null): ConsentChoice | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isConsentChoice(parsed)) {
      return null;
    }

    if (parsed.version !== CONSENT_VERSION) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const getConsent = (): ConsentChoice | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  return parseConsentChoice(storage.getItem(CONSENT_STORAGE_KEY));
};

export const hasAnalyticsConsent = (): boolean => {
  return getConsent()?.analytics === true;
};

export const hasMarketingConsent = (): boolean => {
  return getConsent()?.marketing === true;
};

export const hasConsentChoice = (): boolean => {
  return getConsent() !== null;
};

export const writeConsent = (
  flags: ConsentFlags,
  now: number = Date.now(),
): ConsentChoice => {
  const choice: ConsentChoice = {
    analytics: flags.analytics,
    marketing: flags.marketing,
    ts: now,
    version: CONSENT_VERSION,
  };
  const storage = getStorage();
  storage?.setItem(CONSENT_STORAGE_KEY, JSON.stringify(choice));
  return choice;
};

export const clearConsent = (): void => {
  getStorage()?.removeItem(CONSENT_STORAGE_KEY);
};

export const isWithdrawingConsent = (
  previous: ConsentChoice | null,
  next: ConsentFlags,
): boolean => {
  if (!previous) {
    return false;
  }

  return (
    (previous.analytics && !next.analytics) ||
    (previous.marketing && !next.marketing)
  );
};

export const isTrackingCookieName = (name: string): boolean => {
  if (TRACKING_COOKIE_EXACT_NAMES.includes(name as (typeof TRACKING_COOKIE_EXACT_NAMES)[number])) {
    return true;
  }

  return TRACKING_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix));
};

export const readCookieNames = (
  cookieHeader: string = typeof document === "undefined" ? "" : document.cookie,
): string[] => {
  if (!cookieHeader.trim()) {
    return [];
  }

  return cookieHeader
    .split(";")
    .map((part) => part.trim().split("=")[0]?.trim())
    .filter((name): name is string => Boolean(name));
};

export const getCookieDomainCandidates = (
  hostname: string,
): Array<string | undefined> => {
  const candidates: Array<string | undefined> = [undefined, hostname, `.${hostname}`];
  const parts = hostname.split(".").filter(Boolean);

  if (parts.length >= 2) {
    const parent = parts.slice(1).join(".");
    candidates.push(parent, `.${parent}`);
  }

  return [...new Set(candidates)];
};

const expireCookie = (
  name: string,
  domain: string | undefined,
  doc: Document,
): void => {
  const encodedName = encodeURIComponent(name);
  const domainPart = domain ? `; domain=${domain}` : "";
  doc.cookie = `${encodedName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainPart}`;
};

export const clearTrackingCookies = (
  doc: Document = document,
  hostname: string = typeof window === "undefined" ? "" : window.location.hostname,
): string[] => {
  const names = readCookieNames(doc.cookie).filter(isTrackingCookieName);
  const domains = getCookieDomainCandidates(hostname);

  names.forEach((name) => {
    domains.forEach((domain) => {
      expireCookie(name, domain, doc);
    });
  });

  return names;
};
