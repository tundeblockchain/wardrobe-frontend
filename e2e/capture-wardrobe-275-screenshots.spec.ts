import { expect, test, type Page } from "@playwright/test";
import {
  mockFirebaseAuthNetwork,
  openSignedInHome,
  seedFirebaseAuth,
} from "./signedInApp";
import { installTrackingApiMocks } from "./trackingApiMock";
import { seedConsent } from "./trackingHelpers";

const shouldCapture = process.env.CAPTURE_SCREENSHOTS === "1";
const capturePhase = process.env.CAPTURE_PHASE === "before" ? "before" : "after";

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const;

const openThemedApp = async (
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
  await seedFirebaseAuth(page);
  await mockFirebaseAuthNetwork(page);
  await installTrackingApiMocks(page, {
    startSubscribed: true,
    seedWish: true,
    seedOutfit: true,
  });
  await openSignedInHome(page);
};

const screenshotPath = (
  screenName: string,
  viewport: keyof typeof viewports,
  theme: "light" | "dark",
): string => {
  const themeSuffix = theme === "dark" ? "-dark" : "";
  return `docs/screenshots/WARDROBE-275/${screenName}-${viewport}-${capturePhase}${themeSuffix}.png`;
};

test.describe("WARDROBE-275 screenshot capture", () => {
  test.skip(
    !shouldCapture,
    "Set CAPTURE_SCREENSHOTS=1 to refresh docs/screenshots/WARDROBE-275.",
  );

  test("captures wish detail, outfit detail, Try On, and recommendations", async ({
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

        const wishPage = await browser.newPage({ viewport });
        await openThemedApp(wishPage, theme);
        await wishPage.getByRole("button", { name: "Black loafers" }).click();
        const wishDetail = wishPage.getByRole("dialog", {
          name: "Black loafers",
        });
        await expect(wishDetail).toBeVisible();
        await expect(
          wishDetail.getByRole("heading", { name: "Black loafers" }),
        ).toBeVisible();
        await expect(
          wishDetail.getByRole("button", { name: "Virtual Try On this wish" }),
        ).toBeVisible();
        await expect(wishPage.locator(".MuiDialog-paper")).toHaveCSS(
          "opacity",
          "1",
        );
        await wishDetail
          .getByRole("button", { name: "Mark this wish as owned" })
          .scrollIntoViewIfNeeded();
        await wishPage.screenshot({
          path: screenshotPath("wish-detail", viewportName, theme),
        });
        await wishPage.close();

        const outfitPage = await browser.newPage({ viewport });
        await openThemedApp(outfitPage, theme);
        await outfitPage.goto(
          "/app/outfits/outfit_brunch01/edit?wardrobeId=wd_weekend01",
        );
        await expect(
          outfitPage.getByRole("heading", { level: 1, name: "Edit outfit" }),
        ).toBeVisible();
        await expect(
          outfitPage.getByRole("textbox", { name: "Name" }),
        ).toHaveValue("Sunday brunch");
        await outfitPage.screenshot({
          path: screenshotPath("outfit-detail", viewportName, theme),
          fullPage: true,
        });
        await outfitPage.close();

        const tryOnPage = await browser.newPage({ viewport });
        await openThemedApp(tryOnPage, theme);
        await tryOnPage.goto("/app/virtual-try-on");
        await expect(
          tryOnPage.getByRole("heading", { level: 1, name: "Virtual Try On" }),
        ).toBeVisible();
        await expect(
          tryOnPage.getByRole("button", { name: "Start Virtual Try On" }),
        ).toBeVisible();
        await expect(tryOnPage.getByText(/\bAI\b/)).toHaveCount(0);
        await tryOnPage.screenshot({
          path: screenshotPath("try-on", viewportName, theme),
          fullPage: true,
        });
        await tryOnPage.close();

        const recommendationsPage = await browser.newPage({ viewport });
        await openThemedApp(recommendationsPage, theme);
        await recommendationsPage.goto(
          "/app/wardrobes/wd_weekend01/recommendations",
        );
        await expect(
          recommendationsPage.getByRole("heading", {
            level: 1,
            name: "Suggested outfits",
          }),
        ).toBeVisible();
        await expect(
          recommendationsPage.getByRole("heading", {
            name: "Navy + cream look",
          }),
        ).toBeVisible();
        await recommendationsPage.screenshot({
          path: screenshotPath("recommendations", viewportName, theme),
          fullPage: true,
        });
        await recommendationsPage.close();
      }
    }
  });
});
