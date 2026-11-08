import { expect, type Page } from "@playwright/test";
import { installTrackingApiMocks } from "./trackingApiMock";
import {
  E2E_CONSENT_STORAGE_KEY,
  PIXEL_HOST_PATTERN,
  seedTrackingIds,
} from "./trackingHelpers";
import {
  mockFirebaseAuthNetwork,
  seedFirebaseAuth,
} from "./signedInApp";

export type PixelNetworkMonitor = {
  urls: () => string[];
  hasGa: () => boolean;
  hasMeta: () => boolean;
  hasTikTok: () => boolean;
  clear: () => void;
};

export const createPixelNetworkMonitor = async (
  page: Page,
): Promise<PixelNetworkMonitor> => {
  const urls: string[] = [];

  page.on("request", (request) => {
    if (PIXEL_HOST_PATTERN.test(request.url())) {
      urls.push(request.url());
    }
  });

  await page.route(PIXEL_HOST_PATTERN, async (route) => {
    await route.abort();
  });

  return {
    urls: () => [...urls],
    hasGa: () =>
      urls.some((url) =>
        /googletagmanager\.com|google-analytics\.com/.test(url),
      ),
    hasMeta: () => urls.some((url) => /connect\.facebook\.net/.test(url)),
    hasTikTok: () => urls.some((url) => /analytics\.tiktok\.com/.test(url)),
    clear: () => {
      urls.length = 0;
    },
  };
};

export const setupConsentPage = async (page: Page): Promise<PixelNetworkMonitor> => {
  const monitor = await createPixelNetworkMonitor(page);
  await seedTrackingIds(page);
  await installTrackingApiMocks(page);
  return monitor;
};

export const openSignedInApp = async (page: Page): Promise<void> => {
  await seedFirebaseAuth(page);
  await mockFirebaseAuthNetwork(page);
  await page.goto("/app");
  await expect(
    page.getByRole("heading", { level: 1, name: "Your closet" }),
  ).toBeVisible();
};

export const expectNoPixelRequests = (monitor: PixelNetworkMonitor): void => {
  expect(monitor.urls()).toEqual([]);
  expect(monitor.hasGa()).toBe(false);
  expect(monitor.hasMeta()).toBe(false);
  expect(monitor.hasTikTok()).toBe(false);
};

export const readStoredConsent = async (page: Page) => {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  }, E2E_CONSENT_STORAGE_KEY);
};

export const readVendorQueues = async (page: Page) => {
  return page.evaluate(() => {
    const toArray = (value: unknown): unknown[][] => {
      if (!value) {
        return [];
      }

      if (Array.isArray(value)) {
        return value.map((entry) => Array.from(entry as unknown as unknown[]));
      }

      return [];
    };

    const dataLayer = toArray(window.dataLayer);
    const fbqQueue = toArray(window.fbq?.queue);
    const ttqCalls = toArray(window.ttq);

    return { dataLayer, fbqQueue, ttqCalls };
  });
};

export const waitForQueuedEvent = async (
  page: Page,
  vendor: "gtag" | "fbq" | "ttq",
  eventName: string,
): Promise<unknown[]> => {
  await expect
    .poll(async () => {
      const queues = await readVendorQueues(page);
      if (vendor === "gtag") {
        return queues.dataLayer.some(
          (entry) => entry[0] === "event" && entry[1] === eventName,
        );
      }
      if (vendor === "fbq") {
        return queues.fbqQueue.some((entry) => entry[1] === eventName);
      }
      return queues.ttqCalls.some(
        (entry) => entry[0] === "track" && entry[1] === eventName,
      );
    })
    .toBe(true);

  const queues = await readVendorQueues(page);
  if (vendor === "gtag") {
    return (
      queues.dataLayer.find(
        (entry) => entry[0] === "event" && entry[1] === eventName,
      ) ?? []
    );
  }
  if (vendor === "fbq") {
    return queues.fbqQueue.find((entry) => entry[1] === eventName) ?? [];
  }
  return (
    queues.ttqCalls.find(
      (entry) => entry[0] === "track" && entry[1] === eventName,
    ) ?? []
  );
};

export const cookieBanner = (page: Page) => {
  return page.getByRole("dialog", { name: "Cookies on Pocket Closet" });
};

export const preferencesDialog = (page: Page) => {
  return page.getByRole("dialog", { name: "Cookie preferences" });
};

export type CheckoutRequestCapture = {
  bodies: () => unknown[];
  waitForBody: () => Promise<Record<string, unknown>>;
};

export const captureCheckoutRequests = (page: Page): CheckoutRequestCapture => {
  const bodies: unknown[] = [];

  page.on("request", (request) => {
    if (
      request.method() !== "POST" ||
      !request.url().includes("/billing/checkout-session")
    ) {
      return;
    }

    bodies.push(request.postDataJSON());
  });

  return {
    bodies: () => [...bodies],
    waitForBody: async () => {
      await expect.poll(() => bodies.length).toBeGreaterThan(0);
      const body = bodies[bodies.length - 1];
      expect(body).toBeTruthy();
      return body as Record<string, unknown>;
    },
  };
};

export const expectCheckoutMarketingConsent = (
  body: Record<string, unknown>,
  expected: boolean,
): void => {
  expect(body.marketingConsent).toBe(expected);
  expect(typeof body.marketingConsent).toBe("boolean");
  const serialized = JSON.stringify(body);
  expect(serialized).toContain(`"marketingConsent":${expected}`);
  expect(serialized).not.toContain(`"marketingConsent":"${expected}"`);
};
