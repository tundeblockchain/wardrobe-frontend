import { expect, test, type Page } from "@playwright/test";
import { installCompPremiumApiMocks } from "./compPremiumApiMock";
import {
  mockFirebaseAuthNetwork,
  seedFirebaseAuth,
} from "./signedInApp";
import { seedConsent } from "./trackingHelpers";

const shouldCapture = process.env.CAPTURE_SCREENSHOTS === "1";
const capturePhase = process.env.CAPTURE_PHASE === "before" ? "before" : "after";

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const;

const screenshotPath = (
  screenName: string,
  viewport: keyof typeof viewports,
  theme: "light" | "dark",
  phase: "before" | "after" = capturePhase,
): string => {
  const themeSuffix = theme === "dark" ? "-dark" : "";
  return `docs/screenshots/WARDROBE-292/${screenName}-${viewport}-${phase}${themeSuffix}.png`;
};

const openThemedCompSession = async (
  page: Page,
  theme: "light" | "dark",
): Promise<void> => {
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: "wardrobe.theme-preference", value: theme },
  );
  await page.emulateMedia({
    reducedMotion: "reduce",
    colorScheme: theme,
  });
  await seedConsent(page, { analytics: false, marketing: false });
  await seedFirebaseAuth(page);
  await mockFirebaseAuthNetwork(page);
  await installCompPremiumApiMocks(page);
};

test.describe("WARDROBE-292 screenshot capture", () => {
  test.skip(
    !shouldCapture,
    "Set CAPTURE_SCREENSHOTS=1 to refresh docs/screenshots/WARDROBE-292.",
  );

  test("captures pricing and account plan views for a complimentary Premium user", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(240_000);
    test.skip(
      testInfo.project.name !== "chromium",
      "Capture once from the chromium project.",
    );

    const themes = ["light", "dark"] as const;
    const viewportNames = ["desktop", "tablet", "mobile"] as const;

    for (const viewportName of viewportNames) {
      for (const theme of themes) {
        const viewport = viewports[viewportName];

        const pricingPage = await browser.newPage({ viewport });
        await openThemedCompSession(pricingPage, theme);
        await pricingPage.goto("/app/pricing");
        await expect(
          pricingPage.getByRole("heading", { level: 1, name: "Pricing" }),
        ).toBeVisible();
        await expect(
          pricingPage.getByRole("heading", { level: 2, name: "Premium" }),
        ).toBeVisible();
        await pricingPage.waitForTimeout(400);
        await pricingPage.screenshot({
          path: screenshotPath("pricing", viewportName, theme),
          fullPage: true,
        });
        await pricingPage.close();

        const settingsPage = await browser.newPage({ viewport });
        await openThemedCompSession(settingsPage, theme);
        await settingsPage.goto("/app/settings");
        await expect(
          settingsPage.getByRole("heading", {
            level: 1,
            name: "Profile & Settings",
          }),
        ).toBeVisible();
        await expect(
          settingsPage.getByRole("heading", { name: "Plan" }),
        ).toBeVisible();
        await settingsPage
          .getByRole("heading", { name: "Plan" })
          .scrollIntoViewIfNeeded();
        await settingsPage.waitForTimeout(400);
        await settingsPage.screenshot({
          path: screenshotPath("settings-plan", viewportName, theme),
          fullPage: true,
        });
        await settingsPage.close();
      }
    }
  });
});
