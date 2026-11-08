import { expect, test, type Page } from "@playwright/test";
import {
  mockFirebaseAuthNetwork,
  openSignedInHome,
  seedFirebaseAuth,
} from "./signedInApp";
import { seedConsent } from "./trackingHelpers";
import {
  httpsWish,
  installWishlistApiMocks,
  premiumEntitlement,
  tryOnHistoryWish,
  weekendWardrobe,
  workWardrobe,
  type WishlistMockOptions,
} from "./wishlistApiMock";

const shouldCapture = process.env.CAPTURE_SCREENSHOTS === "1";
const capturePhase = process.env.CAPTURE_PHASE === "before" ? "before" : "after";

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const;

const openThemedHome = async (
  page: Page,
  theme: "light" | "dark",
  options?: WishlistMockOptions,
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
  await installWishlistApiMocks(page, options);
  await openSignedInHome(page);
};

const screenshotPath = (
  viewport: keyof typeof viewports,
  suffix: string,
  theme: "light" | "dark",
): string => {
  const themeSuffix = theme === "dark" ? "-dark" : "";
  return `docs/screenshots/WARDROBE-255/wish-detail-${viewport}-${suffix}${themeSuffix}.png`;
};

test.describe("WARDROBE-255 screenshot capture", () => {
  test.skip(
    !shouldCapture,
    "Set CAPTURE_SCREENSHOTS=1 to refresh docs/screenshots/WARDROBE-255.",
  );

  test("captures wish detail Try On action and result", async ({
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
        const viewport = viewports[viewportName];

        const action = await browser.newPage({ viewport });
        await openThemedHome(action, theme, {
          wishes: [httpsWish],
          wardrobes: [weekendWardrobe, workWardrobe],
          entitlement: premiumEntitlement,
        });
        await action.getByRole("button", { name: "Black loafers" }).click();
        const actionDialog = action.getByRole("dialog", {
          name: "Black loafers",
        });
        await expect(actionDialog).toBeVisible();
        if (capturePhase === "after") {
          await expect(
            action.getByRole("button", { name: "Virtual Try On this wish" }),
          ).toBeVisible();
        } else {
          await expect(
            action.getByRole("button", { name: "Virtual Try On this wish" }),
          ).toHaveCount(0);
        }
        await expect(action.locator(".MuiDialog-root")).toHaveCSS(
          "opacity",
          "1",
        );
        if (capturePhase === "after") {
          await action
            .getByRole("button", { name: "Virtual Try On this wish" })
            .scrollIntoViewIfNeeded();
        } else {
          await action
            .getByRole("button", { name: "Mark this wish as owned" })
            .scrollIntoViewIfNeeded();
        }
        await action.screenshot({
          path: screenshotPath(viewportName, `${capturePhase}-action`, theme),
        });
        await action.close();

        if (capturePhase === "before") {
          continue;
        }

        const result = await browser.newPage({ viewport });
        await openThemedHome(result, theme, {
          wishes: [tryOnHistoryWish],
          wardrobes: [weekendWardrobe, workWardrobe],
          entitlement: premiumEntitlement,
        });
        await result.getByRole("button", { name: "History loafers" }).click();
        const resultDialog = result.getByRole("dialog", {
          name: "History loafers",
        });
        await expect(resultDialog).toBeVisible();
        await expect(
          result.getByRole("region", { name: "Virtual Try On result" }),
        ).toBeVisible();
        await expect(result.locator(".MuiDialog-root")).toHaveCSS(
          "opacity",
          "1",
        );
        await result
          .getByRole("region", { name: "Virtual Try On result" })
          .scrollIntoViewIfNeeded();
        await result.screenshot({
          path: screenshotPath(viewportName, "after-result", theme),
        });
        await result.close();
      }
    }
  });
});
