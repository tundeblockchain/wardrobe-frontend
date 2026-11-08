import { expect, test, type Page } from "@playwright/test";
import { installTrackingApiMocks } from "./trackingApiMock";
import { seedConsent } from "./trackingHelpers";
import {
  mockFirebaseAuthNetwork,
  seedFirebaseAuth,
} from "./signedInApp";

const shouldCapture = process.env.CAPTURE_SCREENSHOTS === "1";
const capturePhase = process.env.CAPTURE_PHASE === "before" ? "before" : "after";

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const;

const setTheme = async (page: Page, theme: "light" | "dark"): Promise<void> => {
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: "wardrobe.theme-preference", value: theme },
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
};

const screenshotPath = (
  scene: string,
  viewport: keyof typeof viewports,
  theme: "light" | "dark",
): string => {
  const themeSuffix = theme === "dark" ? "-dark" : "";
  return `docs/screenshots/WARDROBE-257/${scene}-${viewport}-${capturePhase}${themeSuffix}.png`;
};

const openSignedInPricing = async (
  page: Page,
  theme: "light" | "dark",
): Promise<void> => {
  await setTheme(page, theme);
  await seedConsent(page, { analytics: false, marketing: false });
  await seedFirebaseAuth(page);
  await mockFirebaseAuthNetwork(page);
  await installTrackingApiMocks(page);
  await page.goto("/app/pricing");
  await expect(
    page.getByRole("heading", { level: 1, name: "Pricing" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Upgrade to Basic" }),
  ).toBeVisible();
};

const openPreferences = async (
  page: Page,
  theme: "light" | "dark",
): Promise<void> => {
  await setTheme(page, theme);
  await seedConsent(page, { analytics: false, marketing: false });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
  await page
    .getByRole("contentinfo")
    .getByRole("button", { name: "Cookie settings" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Cookie preferences" }),
  ).toBeVisible();
};

test.describe("WARDROBE-257 screenshot capture", () => {
  test.skip(
    !shouldCapture,
    "Set CAPTURE_SCREENSHOTS=1 to refresh docs/screenshots/WARDROBE-257.",
  );

  test("captures pricing checkout and cookie preferences", async ({
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

        const pricing = await browser.newPage({ viewport });
        await openSignedInPricing(pricing, theme);
        await pricing.screenshot({
          path: screenshotPath("pricing", viewportName, theme),
          fullPage: false,
        });
        await pricing.close();

        const preferences = await browser.newPage({ viewport });
        await openPreferences(preferences, theme);
        await preferences.screenshot({
          path: screenshotPath("preferences", viewportName, theme),
          fullPage: false,
        });
        await preferences.close();
      }
    }
  });
});
