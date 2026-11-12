import { expect, test, type Page } from "@playwright/test";
import { E2E_API_ORIGIN } from "./env";
import {
  PIXEL_HOST_PATTERN,
  seedConsent,
} from "./trackingHelpers";

const shouldCapture = process.env.CAPTURE_SCREENSHOTS === "1";
const capturePhase = process.env.CAPTURE_PHASE === "before" ? "before" : "after";

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const;

const mockPrivacyNetwork = async (page: Page): Promise<void> => {
  await page.route(PIXEL_HOST_PATTERN, async (route) => {
    await route.abort();
  });
  await page.route(
    (url) => url.origin === E2E_API_ORIGIN,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      });
    },
  );
};

const openThemedPrivacy = async (
  page: Page,
  theme: "light" | "dark",
): Promise<void> => {
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: "wardrobe.theme-preference", value: theme },
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seedConsent(page, { analytics: false, marketing: false });
  await mockPrivacyNetwork(page);
  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { level: 1, name: "Privacy Policy" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Android advertising identifier" }),
  ).toBeVisible();
  if (capturePhase === "before") {
    await expect(page.getByText("Last updated 7 November 2026")).toBeVisible();
  } else {
    await expect(page.getByText("Last updated 12 November 2026")).toBeVisible();
    await expect(
      page.getByText(/Account > Privacy switch is what counts/),
    ).toBeVisible();
  }
};

const screenshotPath = (
  viewport: keyof typeof viewports,
  theme: "light" | "dark",
  suffix = "",
): string => {
  const themeSuffix = theme === "dark" ? "-dark" : "";
  return `docs/screenshots/WARDROBE-261/privacy-${viewport}-${capturePhase}${suffix}${themeSuffix}.png`;
};

test.describe("WARDROBE-261 screenshot capture", () => {
  test.skip(
    !shouldCapture,
    "Set CAPTURE_SCREENSHOTS=1 to refresh docs/screenshots/WARDROBE-261.",
  );

  test("captures privacy policy Android advertising section", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(180_000);
    test.skip(
      testInfo.project.name !== "chromium",
      "Capture once from the chromium project.",
    );

    const themes = ["light", "dark"] as const;
    const viewportNames = ["desktop", "tablet", "mobile"] as const;

    for (const viewportName of viewportNames) {
      for (const theme of themes) {
        const page = await browser.newPage({
          viewport: viewports[viewportName],
        });
        await openThemedPrivacy(page, theme);
        await page.screenshot({
          path: screenshotPath(viewportName, theme),
          fullPage: true,
        });
        await page.locator("header").evaluate((header) => {
          header.style.setProperty("display", "none", "important");
        });
        const androidSection = page.locator("#android-advertising-id");
        await androidSection.scrollIntoViewIfNeeded();
        await androidSection.screenshot({
          path: screenshotPath(viewportName, theme, "-section"),
        });
        await page.close();
      }
    }
  });
});
