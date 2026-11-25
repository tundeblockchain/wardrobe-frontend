import { expect, test, type Page } from "@playwright/test";
import {
  installCompPremiumApiMocks,
  type CompPremiumMockState,
} from "./compPremiumApiMock";
import {
  mockFirebaseAuthNetwork,
  seedFirebaseAuth,
} from "./signedInApp";
import { seedConsent } from "./trackingHelpers";

const openCompSession = async (
  page: Page,
): Promise<CompPremiumMockState> => {
  await seedConsent(page, { analytics: false, marketing: false });
  await seedFirebaseAuth(page);
  await mockFirebaseAuthNetwork(page);
  return installCompPremiumApiMocks(page);
};

const expectNoPurchaseActions = async (page: Page): Promise<void> => {
  await expect(page.getByRole("button", { name: "Upgrade to Basic" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Upgrade to Premium" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Choose plan" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Manage subscription" }),
  ).toHaveCount(0);
  await expect(page.getByText(/App Store|Google Play/i)).toHaveCount(0);
  await expect(page.getByText("Renews or ends")).toHaveCount(0);
};

test.describe("complimentary Premium", () => {
  test("shows Premium on pricing with no checkout, upgrade, or manage actions", async ({
    page,
  }) => {
    const api = await openCompSession(page);
    await page.goto("/app/pricing");

    await expect(
      page.getByRole("heading", { level: 1, name: "Pricing" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Premium" }),
    ).toBeVisible();
    await expect(page.getByLabel("Current plan")).toBeVisible();
    await expect(page.getByText("Premium · Complimentary")).toBeVisible();
    await expect(
      page.getByText("This account has complimentary Premium."),
    ).toBeVisible();
    await expectNoPurchaseActions(page);
    expect(api.checkoutCalls).toBe(0);
    expect(api.portalCalls).toBe(0);
  });

  test("shows complimentary Premium on account/billing with no manage or store copy", async ({
    page,
  }) => {
    const api = await openCompSession(page);
    await page.goto("/app/settings");

    await expect(
      page.getByRole("heading", { level: 1, name: "Profile & Settings" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Plan" })).toBeVisible();
    await expect(page.getByText("Premium · Complimentary")).toBeVisible();
    await expect(
      page.getByText(
        "This Premium plan is complimentary and does not renew.",
      ),
    ).toBeVisible();
    await expectNoPurchaseActions(page);
    expect(api.checkoutCalls).toBe(0);
    expect(api.portalCalls).toBe(0);
  });
});
