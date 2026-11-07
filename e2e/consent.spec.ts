import { expect, test } from "@playwright/test";
import { installTrackingApiMocks } from "./trackingApiMock";
import {
  cookieBanner,
  createPixelNetworkMonitor,
  expectNoPixelRequests,
  preferencesDialog,
  readStoredConsent,
  setupConsentPage,
  waitForQueuedEvent,
} from "./consentHelpers";
import {
  E2E_CONSENT_STORAGE_KEY,
  E2E_CONSENT_VERSION,
  clickStoreCta,
  seedTrackingIds,
} from "./trackingHelpers";
import {
  mockFirebaseAuthNetwork,
  seedFirebaseAuth,
} from "./signedInApp";

test.describe("cookie consent", () => {
  test("does not request tracking hosts before a choice on landing or /app", async ({
    page,
  }) => {
    const monitor = await setupConsentPage(page);

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(cookieBanner(page)).toBeVisible();
    expectNoPixelRequests(monitor);

    await seedFirebaseAuth(page);
    await mockFirebaseAuthNetwork(page);
    await page.goto("/app");
    await expect(
      page.getByRole("heading", { level: 1, name: "Your closet" }),
    ).toBeVisible();
    await expect(cookieBanner(page)).toBeVisible();
    expectNoPixelRequests(monitor);
  });

  test("reject all blocks pixels after navigation and reload", async ({
    page,
  }) => {
    const monitor = await setupConsentPage(page);

    await page.goto("/");
    await expect(cookieBanner(page)).toBeVisible();
    await page.getByRole("button", { name: "Reject all optional cookies" }).click();
    await expect(cookieBanner(page)).toHaveCount(0);
    expectNoPixelRequests(monitor);

    const stored = await readStoredConsent(page);
    expect(stored).toEqual(
      expect.objectContaining({
        analytics: false,
        marketing: false,
        version: E2E_CONSENT_VERSION,
      }),
    );

    await page.goto("/privacy");
    await expect(
      page.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeVisible();
    await expect(cookieBanner(page)).toHaveCount(0);
    expectNoPixelRequests(monitor);

    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeVisible();
    await expect(cookieBanner(page)).toHaveCount(0);
    expectNoPixelRequests(monitor);
  });

  test("accept all loads scripts and still fires store CTA and Subscribe events", async ({
    page,
  }) => {
    const monitor = await createPixelNetworkMonitor(page);
    await seedTrackingIds(page);
    await installTrackingApiMocks(page, { startSubscribed: true });
    await seedFirebaseAuth(page);
    await mockFirebaseAuthNetwork(page);

    await page.goto("/");
    await expect(cookieBanner(page)).toBeVisible();
    await page.getByRole("button", { name: "Accept all cookies" }).click();
    await expect(cookieBanner(page)).toHaveCount(0);

    await expect.poll(() => monitor.hasGa()).toBe(true);
    await expect.poll(() => monitor.hasMeta()).toBe(true);
    await expect.poll(() => monitor.hasTikTok()).toBe(true);

    await clickStoreCta(page);
    await waitForQueuedEvent(page, "gtag", "store_cta_click");
    await waitForQueuedEvent(page, "fbq", "StoreCtaClick");
    await waitForQueuedEvent(page, "ttq", "ClickButton");

    await page.goto("/app/billing/success?session_id=cs_test_123");
    await expect(
      page.getByRole("heading", { name: "You are subscribed" }),
    ).toBeVisible();

    const subscribe = await waitForQueuedEvent(page, "fbq", "Subscribe");
    expect(JSON.stringify(subscribe)).toContain("stripe_cs_test_123");
    const tiktokSubscribe = await waitForQueuedEvent(page, "ttq", "Subscribe");
    expect(JSON.stringify(tiktokSubscribe)).toContain("stripe_cs_test_123");
    await waitForQueuedEvent(page, "gtag", "subscribe");
  });

  test("manage preferences analytics only loads GA and not Meta or TikTok", async ({
    page,
  }) => {
    const monitor = await setupConsentPage(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Manage cookie preferences" }).click();
    const dialog = preferencesDialog(page);
    await expect(dialog).toBeVisible();
    await dialog.getByRole("switch", { name: "Analytics cookies" }).click();
    await dialog.getByRole("button", { name: "Save cookie preferences" }).click();
    await expect(cookieBanner(page)).toHaveCount(0);
    await expect.poll(() => monitor.hasGa()).toBe(true);
    expect(monitor.hasMeta()).toBe(false);
    expect(monitor.hasTikTok()).toBe(false);
  });

  test("manage preferences marketing only loads Meta and TikTok and not GA", async ({
    page,
  }) => {
    const monitor = await setupConsentPage(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Manage cookie preferences" }).click();
    const dialog = preferencesDialog(page);
    await expect(dialog).toBeVisible();
    await dialog.getByRole("switch", { name: "Marketing cookies" }).click();
    await dialog.getByRole("button", { name: "Save cookie preferences" }).click();
    await expect(cookieBanner(page)).toHaveCount(0);
    await expect.poll(() => monitor.hasMeta()).toBe(true);
    await expect.poll(() => monitor.hasTikTok()).toBe(true);
    expect(monitor.hasGa()).toBe(false);
  });

  test("footer Cookie settings can reject after accept and accept after reject", async ({
    page,
  }) => {
    const monitor = await setupConsentPage(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Accept all cookies" }).click();
    await expect.poll(() => monitor.hasGa()).toBe(true);
    await expect.poll(() => monitor.hasMeta()).toBe(true);

    await page.evaluate(() => {
      document.cookie = "_ga=GA1.1.test; path=/";
      document.cookie = "_gid=id; path=/";
      document.cookie = "_fbp=fb.1; path=/";
      document.cookie = "_fbc=fb.1.c; path=/";
      document.cookie = "_ttp=tt; path=/";
    });

    monitor.clear();
    await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
    await page
      .getByRole("contentinfo")
      .getByRole("button", { name: "Cookie settings" })
      .click();
    const dialog = preferencesDialog(page);
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Reject all optional cookies" }).click();

    await expect(cookieBanner(page)).toHaveCount(0);
    const cookiesAfterReject = await page.evaluate(() => document.cookie);
    expect(cookiesAfterReject).not.toMatch(/_ga=|_gid=|_fbp=|_fbc=|_ttp=/);

    await page.goto("/privacy");
    await expect(
      page.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeVisible();
    expectNoPixelRequests(monitor);

    await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
    await page
      .getByRole("contentinfo")
      .getByRole("button", { name: "Cookie settings" })
      .click();
    await expect(preferencesDialog(page)).toBeVisible();
    await preferencesDialog(page)
      .getByRole("button", { name: "Accept all cookies" })
      .click();
    await expect.poll(() => monitor.hasGa()).toBe(true);
    await expect.poll(() => monitor.hasMeta()).toBe(true);
    await expect.poll(() => monitor.hasTikTok()).toBe(true);
  });

  test("banner is keyboard operable and preferences close on Escape", async ({
    page,
  }) => {
    await setupConsentPage(page);
    await page.goto("/");
    const banner = cookieBanner(page);
    await expect(banner).toBeVisible();
    await expect(banner).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Reject all optional cookies" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Accept all cookies" }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Manage cookie preferences" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");

    const dialog = preferencesDialog(page);
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(banner).toBeVisible();
  });

  test("re-asks after a consent version bump", async ({ page }) => {
    await setupConsentPage(page);
    await page.addInitScript(
      ({ key }) => {
        window.localStorage.setItem(
          key,
          JSON.stringify({
            analytics: true,
            marketing: true,
            ts: 1,
            version: 0,
          }),
        );
      },
      { key: E2E_CONSENT_STORAGE_KEY },
    );

    await page.goto("/");
    await expect(cookieBanner(page)).toBeVisible();
  });
});
