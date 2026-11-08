import { expect, test, type Page } from "@playwright/test";
import {
  captureCheckoutRequests,
  cookieBanner,
  expectCheckoutMarketingConsent,
  setupConsentPage,
} from "./consentHelpers";
import {
  mockFirebaseAuthNetwork,
  seedFirebaseAuth,
} from "./signedInApp";

const openSignedInPricing = async (page: Page): Promise<void> => {
  await seedFirebaseAuth(page);
  await mockFirebaseAuthNetwork(page);
  await page.goto("/app/pricing");
  await expect(
    page.getByRole("heading", { level: 1, name: "Pricing" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Upgrade to Basic" }),
  ).toBeVisible();
};

const startBasicCheckout = async (page: Page): Promise<void> => {
  const button = page.getByRole("button", { name: "Upgrade to Basic" });
  await button.scrollIntoViewIfNeeded();
  await button.click();
};

test.describe("checkout marketingConsent", () => {
  test("sends marketingConsent true after Accept all", async ({ page }) => {
    const checkout = captureCheckoutRequests(page);
    await setupConsentPage(page);
    await openSignedInPricing(page);

    await page.getByRole("button", { name: "Accept all cookies" }).click();
    await expect(cookieBanner(page)).toHaveCount(0);
    await startBasicCheckout(page);

    const body = await checkout.waitForBody();
    expectCheckoutMarketingConsent(body, true);
    expect(body.tier).toBe("basic");
  });

  test("sends marketingConsent false after Reject all", async ({ page }) => {
    const checkout = captureCheckoutRequests(page);
    await setupConsentPage(page);
    await openSignedInPricing(page);

    await page.getByRole("button", { name: "Reject all optional cookies" }).click();
    await expect(cookieBanner(page)).toHaveCount(0);
    await startBasicCheckout(page);

    const body = await checkout.waitForBody();
    expectCheckoutMarketingConsent(body, false);
    expect(body.tier).toBe("basic");
  });

  test("sends marketingConsent false when no choice has been made", async ({
    page,
  }) => {
    const checkout = captureCheckoutRequests(page);
    await setupConsentPage(page);
    await openSignedInPricing(page);
    await expect(cookieBanner(page)).toBeVisible();

    await startBasicCheckout(page);

    const body = await checkout.waitForBody();
    expectCheckoutMarketingConsent(body, false);
    expect(body.tier).toBe("basic");
  });
});
