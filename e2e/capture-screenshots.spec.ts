import { expect, test, type Page } from "@playwright/test";
import {
  mockFirebaseAuthNetwork,
  openSignedInHome,
  seedFirebaseAuth,
} from "./signedInApp";
import {
  httpsWish,
  incompleteWish,
  installWishlistApiMocks,
  weekendWardrobe,
  workWardrobe,
  type WishlistMockOptions,
} from "./wishlistApiMock";

const shouldCapture = process.env.CAPTURE_SCREENSHOTS === "1";

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
  return `docs/screenshots/WARDROBE-246/home-${viewport}-${suffix}${themeSuffix}.png`;
};

test.describe("WARDROBE-246 screenshot capture", () => {
  test.skip(
    !shouldCapture,
    "Set CAPTURE_SCREENSHOTS=1 to refresh docs/screenshots/WARDROBE-246 after images.",
  );

  test("captures after screenshots including the acquire-ready prompt", async ({
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

        const populated = await browser.newPage({ viewport });
        await openThemedHome(populated, theme, {
          wishes: [httpsWish, incompleteWish],
          wardrobes: [weekendWardrobe, workWardrobe],
        });
        await expect(
          populated.getByRole("heading", { level: 2, name: "Wish list" }),
        ).toBeVisible();
        await populated.screenshot({
          path: screenshotPath(viewportName, "after", theme),
          fullPage: true,
        });
        await populated.close();

        const empty = await browser.newPage({ viewport });
        await openThemedHome(empty, theme, {
          wishes: [],
          wardrobes: [weekendWardrobe],
        });
        await expect(
          empty.getByRole("heading", { name: "No wishes yet" }),
        ).toBeVisible();
        await empty.screenshot({
          path: screenshotPath(viewportName, "after-empty", theme),
          fullPage: true,
        });
        await empty.close();

        const addDialog = await browser.newPage({ viewport });
        await openThemedHome(addDialog, theme, {
          wishes: [],
          wardrobes: [weekendWardrobe],
        });
        await addDialog.getByRole("button", { name: "Add to wish list" }).click();
        const addForm = addDialog.getByRole("dialog", {
          name: "Add to wish list",
        });
        await expect(addForm).toBeVisible();
        await expect(addDialog.locator(".MuiDialog-root")).toHaveCSS(
          "opacity",
          "1",
        );
        await addDialog.screenshot({
          path: screenshotPath(viewportName, "after-add-dialog", theme),
          fullPage: true,
        });
        await addDialog.close();

        const picker = await browser.newPage({ viewport });
        await openThemedHome(picker, theme, {
          wishes: [httpsWish],
          wardrobes: [weekendWardrobe, workWardrobe],
        });
        await picker.getByRole("button", { name: "Black loafers" }).click();
        await picker
          .getByRole("button", { name: "Mark this wish as owned" })
          .click();
        const pickerDialog = picker.getByRole("dialog", {
          name: "Choose a wardrobe",
        });
        await expect(pickerDialog).toBeVisible();
        await expect(picker.locator(".MuiDialog-root")).toHaveCSS(
          "opacity",
          "1",
        );
        await picker.screenshot({
          path: screenshotPath(viewportName, "after-acquire-picker", theme),
          fullPage: true,
        });
        await picker.close();

        const ready = await browser.newPage({ viewport });
        await openThemedHome(ready, theme, {
          wishes: [incompleteWish],
          wardrobes: [weekendWardrobe],
        });
        await ready.getByRole("button", { name: "Linen shirt" }).click();
        await ready
          .getByRole("button", { name: "Mark this wish as owned" })
          .click();
        const readyDialog = ready.getByRole("dialog", {
          name: "Add a few details first",
        });
        await expect(readyDialog).toBeVisible();
        await expect(ready.locator(".MuiDialog-root")).toHaveCSS("opacity", "1");
        await expect(
          ready.getByRole("button", {
            name: "Add the missing category or photo",
          }),
        ).toBeVisible();
        await ready.screenshot({
          path: screenshotPath(viewportName, "after-acquire-ready", theme),
          fullPage: true,
        });
        await ready.close();
      }
    }
  });
});
