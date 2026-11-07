import { expect, type Page } from "@playwright/test";
import { e2eIdToken, mockFirebaseAuthNetwork, seedFirebaseAuth } from "./signedInApp";
import { E2E_USER_EMAIL, E2E_USER_ID } from "./env";

export const E2E_TRACKING_IDS = {
  gaMeasurementId: "G-XXXXXXXXXX",
  metaPixelId: "000000000000000",
  tiktokPixelId: "CXXXXXXXXXXXXXXXXX",
} as const;

export const E2E_USER_EXTERNAL_ID =
  "c6c289e49e9c05b2145860387b73bcb18df43fb09a1e4a4a9713c76c88bb541b";

export type TrackingCallLog = {
  gtag: unknown[][];
  fbq: unknown[][];
  ttq: unknown[][];
};

export const PIXEL_HOST_PATTERN =
  /googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|facebook\.com\/tr|analytics\.tiktok\.com/;

export const blockPixelNetwork = async (page: Page): Promise<void> => {
  await page.route(PIXEL_HOST_PATTERN, async (route) => {
    await route.abort();
  });
};

const TRACKING_CALLS_STORAGE_KEY = "__WARDROBE_TRACKING_CALLS__";

export const E2E_CONSENT_STORAGE_KEY = "pc_consent_v1";
export const E2E_CONSENT_VERSION = 1;

export const ACCEPT_ALL_CONSENT = {
  analytics: true,
  marketing: true,
  ts: 1,
  version: E2E_CONSENT_VERSION,
} as const;

export const seedConsent = async (
  page: Page,
  choice: {
    analytics: boolean;
    marketing: boolean;
    ts?: number;
    version?: number;
  } = ACCEPT_ALL_CONSENT,
): Promise<void> => {
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    {
      key: E2E_CONSENT_STORAGE_KEY,
      value: {
        analytics: choice.analytics,
        marketing: choice.marketing,
        ts: choice.ts ?? Date.now(),
        version: choice.version ?? E2E_CONSENT_VERSION,
      },
    },
  );
};

export const seedTrackingIds = async (page: Page): Promise<void> => {
  await page.addInitScript(({ ids }) => {
    window.__WARDROBE_E2E_TRACKING_IDS__ = ids;
  }, { ids: E2E_TRACKING_IDS });
};

export const installTrackingStubs = async (page: Page): Promise<void> => {
  await seedConsent(page);
  await page.addInitScript(
    ({ ids, storageKey }) => {
      const emptyLog = (): TrackingCallLog => ({
        gtag: [],
        fbq: [],
        ttq: [],
      });

      const readStoredLog = (): TrackingCallLog => {
        try {
          const raw = window.sessionStorage.getItem(storageKey);
          if (!raw) {
            return emptyLog();
          }
          const parsed: unknown = JSON.parse(raw);
          if (
            parsed &&
            typeof parsed === "object" &&
            Array.isArray((parsed as TrackingCallLog).gtag) &&
            Array.isArray((parsed as TrackingCallLog).fbq) &&
            Array.isArray((parsed as TrackingCallLog).ttq)
          ) {
            return parsed as TrackingCallLog;
          }
        } catch {
          return emptyLog();
        }
        return emptyLog();
      };

      const persistLog = (next: TrackingCallLog): void => {
        try {
          window.sessionStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // Ignore quota or private-mode failures; in-memory log still works.
        }
      };

      const calls = readStoredLog();
      window.__WARDROBE_E2E_TRACKING_IDS__ = ids;
      window.__WARDROBE_TRACKING_CALLS__ = calls;

      window.gtag = (...args: unknown[]) => {
        calls.gtag.push(args);
        persistLog(calls);
      };
      window.fbq = (...args: unknown[]) => {
        calls.fbq.push(args);
        persistLog(calls);
      };
      const ttq = ((...args: unknown[]) => {
        calls.ttq.push(args);
        persistLog(calls);
      }) as Window["ttq"];
      if (ttq) {
        ttq.track = (...args: unknown[]) => {
          calls.ttq.push(args);
          persistLog(calls);
        };
        ttq.identify = (payload: Record<string, unknown>) => {
          calls.ttq.push(["identify", payload]);
          persistLog(calls);
        };
        ttq.page = () => undefined;
        ttq.load = () => undefined;
      }
      window.ttq = ttq;
    },
    { ids: E2E_TRACKING_IDS, storageKey: TRACKING_CALLS_STORAGE_KEY },
  );
};

export const clickStoreCta = async (page: Page): Promise<void> => {
  const popupPromise = page.waitForEvent("popup").catch(() => null);
  await page
    .getByRole("link", { name: "Download on the App Store" })
    .first()
    .click();
  const popup = await popupPromise;
  if (popup) {
    await popup.close();
  }
};

export const readTrackingCalls = async (page: Page): Promise<TrackingCallLog> => {
  return page.evaluate(() => {
    const calls = (
      window as Window & {
        __WARDROBE_TRACKING_CALLS__?: TrackingCallLog;
      }
    ).__WARDROBE_TRACKING_CALLS__;
    return (
      calls ?? {
        gtag: [],
        fbq: [],
        ttq: [],
      }
    );
  });
};

export const waitForTrackingEvent = async (
  page: Page,
  vendor: "gtag" | "fbq" | "ttq",
  eventName: string,
): Promise<unknown[]> => {
  await expect
    .poll(async () => {
      try {
        const calls = await readTrackingCalls(page);
        return findTrackingEvent(calls, vendor, eventName) !== undefined;
      } catch {
        return false;
      }
    })
    .toBe(true);

  const calls = await readTrackingCalls(page);
  const match = findTrackingEvent(calls, vendor, eventName);
  expect(match).toBeDefined();
  return match ?? [];
};

export const findTrackingEvent = (
  calls: TrackingCallLog,
  vendor: "gtag" | "fbq" | "ttq",
  eventName: string,
): unknown[] | undefined => {
  if (vendor === "gtag") {
    return calls.gtag.find(
      (call) => call[0] === "event" && call[1] === eventName,
    );
  }

  if (vendor === "fbq") {
    return calls.fbq.find((call) => call[1] === eventName);
  }

  return calls.ttq.find((call) => call[0] === eventName);
};

export const countTrackingEvent = (
  calls: TrackingCallLog,
  vendor: "gtag" | "fbq" | "ttq",
  eventName: string,
): number => {
  if (vendor === "gtag") {
    return calls.gtag.filter(
      (call) => call[0] === "event" && call[1] === eventName,
    ).length;
  }

  if (vendor === "fbq") {
    return calls.fbq.filter((call) => call[1] === eventName).length;
  }

  return calls.ttq.filter((call) => call[0] === eventName).length;
};

export const expectNoPixelScripts = async (page: Page): Promise<void> => {
  const sources = await page.locator("script[src]").evaluateAll((elements) => {
    return elements.map((element) => (element as HTMLScriptElement).src);
  });
  const html = await page.content();
  const haystack = `${sources.join("\n")}\n${html}`;

  expect(haystack).not.toMatch(/googletagmanager\.com/);
  expect(haystack).not.toMatch(/connect\.facebook\.net/);
  expect(haystack).not.toMatch(/facebook\.com\/tr/);
  expect(haystack).not.toMatch(/analytics\.tiktok\.com/);
  expect(haystack).not.toContain("ttq.load(");
};

export const mockFirebaseEmailAuth = async (page: Page): Promise<void> => {
  const token = e2eIdToken();
  await page.route(
    (url) =>
      /identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com|firebaseinstallations\.googleapis\.com|firebase\.googleapis\.com/.test(
        url.hostname,
      ),
    async (route) => {
      const requestUrl = route.request().url();
      if (
        requestUrl.includes("accounts:signUp") ||
        requestUrl.includes("accounts:signInWithPassword")
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            kind: requestUrl.includes("signUp")
              ? "identitytoolkit#SignupNewUserResponse"
              : "identitytoolkit#VerifyPasswordResponse",
            idToken: token,
            email: E2E_USER_EMAIL,
            refreshToken: "playwright-refresh-token",
            expiresIn: "3600",
            localId: E2E_USER_ID,
            registered: true,
          }),
        });
        return;
      }

      if (requestUrl.includes("/v1/token")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            access_token: token,
            expires_in: "3600",
            token_type: "Bearer",
            refresh_token: "playwright-refresh-token",
            id_token: token,
            user_id: E2E_USER_ID,
            project_id: "playwright-project",
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          users: [
            {
              localId: E2E_USER_ID,
              email: E2E_USER_EMAIL,
              emailVerified: true,
            },
          ],
        }),
      });
    },
  );
};

export const openTrackedSignedInHome = async (page: Page): Promise<void> => {
  await seedFirebaseAuth(page);
  await mockFirebaseAuthNetwork(page);
  await page.goto("/app");
  await expect(
    page.getByRole("heading", { level: 1, name: "Your closet" }),
  ).toBeVisible();
};

const isHashedExternalIdPayload = (value: unknown): boolean => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (value as { external_id?: unknown }).external_id === E2E_USER_EXTERNAL_ID;
};

export const waitForHashedExternalId = async (page: Page): Promise<void> => {
  await expect
    .poll(async () => {
      try {
        const calls = await readTrackingCalls(page);
        const metaInit = calls.fbq.find(
          (call) => call[0] === "init" && isHashedExternalIdPayload(call[2]),
        );
        const tiktokIdentify = calls.ttq.find(
          (call) => call[0] === "identify" && isHashedExternalIdPayload(call[1]),
        );
        return Boolean(metaInit && tiktokIdentify);
      } catch {
        return false;
      }
    })
    .toBe(true);
};

export const expectHashedExternalIdOnly = async (page: Page): Promise<void> => {
  await waitForHashedExternalId(page);
  const calls = await readTrackingCalls(page);
  const matchingPayloads = [
    ...calls.fbq.filter((call) => call[0] === "init").map((call) => call[2]),
    ...calls.ttq.filter((call) => call[0] === "identify").map((call) => call[1]),
  ].filter(
    (payload): payload is Record<string, unknown> =>
      Boolean(payload) && typeof payload === "object",
  );

  expect(matchingPayloads.length).toBeGreaterThan(0);
  for (const payload of matchingPayloads) {
    expect(Object.keys(payload)).toEqual(["external_id"]);
    expect(payload.external_id).toBe(E2E_USER_EXTERNAL_ID);
  }

  const serialized = JSON.stringify(matchingPayloads);
  expect(serialized).not.toContain(E2E_USER_EMAIL);
  expect(serialized).not.toContain(E2E_USER_ID);
  expect(serialized.toLowerCase()).not.toContain("email");
  expect(serialized.toLowerCase()).not.toContain("phone");
};
