import { expect, test, type Page } from "@playwright/test";
import { openAdminSupport } from "./adminAuth";
import { installAdminSupportApiMocks } from "./adminSupportApiMock";
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
  return `docs/screenshots/WARDROBE-285/${screenName}-${viewport}-${phase}${themeSuffix}.png`;
};

const openThemedPage = async (
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
};

test.describe("WARDROBE-285 screenshot capture", () => {
  test.skip(
    !shouldCapture,
    "Set CAPTURE_SCREENSHOTS=1 to refresh docs/screenshots/WARDROBE-285.",
  );

  test("captures /admin before the support inbox exists and the public home page", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(180_000);
    test.skip(
      testInfo.project.name !== "chromium",
      "Capture once from the chromium project.",
    );
    test.skip(
      capturePhase !== "before",
      "Before shots are captured from main before the admin route lands.",
    );

    const themes = ["light", "dark"] as const;
    const viewportNames = ["desktop", "tablet", "mobile"] as const;

    for (const viewportName of viewportNames) {
      for (const theme of themes) {
        const viewport = viewports[viewportName];

        const adminPage = await browser.newPage({ viewport });
        await openThemedPage(adminPage, theme);
        await adminPage.goto("/admin");
        await adminPage.waitForTimeout(400);
        await adminPage.screenshot({
          path: screenshotPath("admin-no-route", viewportName, theme, "before"),
          fullPage: true,
        });
        await adminPage.close();

        const homePage = await browser.newPage({ viewport });
        await openThemedPage(homePage, theme);
        await homePage.goto("/");
        await expect(
          homePage.getByRole("heading", {
            name: "Your closet, beautifully organized",
          }),
        ).toBeVisible();
        await homePage.screenshot({
          path: screenshotPath("home", viewportName, theme, "before"),
          fullPage: true,
        });
        await homePage.close();
      }
    }
  });

  test("captures sign-in, not-authorised, inbox, failed-email thread, and home", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(240_000);
    test.skip(
      testInfo.project.name !== "chromium",
      "Capture once from the chromium project.",
    );
    test.skip(
      capturePhase !== "after",
      "After shots are captured once the admin inbox is on the branch.",
    );

    const themes = ["light", "dark"] as const;
    const viewportNames = ["desktop", "tablet", "mobile"] as const;

    for (const viewportName of viewportNames) {
      for (const theme of themes) {
        const viewport = viewports[viewportName];

        const signInPage = await browser.newPage({ viewport });
        await openThemedPage(signInPage, theme);
        await openAdminSupport(signInPage, { admin: false, signedOut: true });
        await signInPage.goto("/admin/support");
        await expect(
          signInPage.getByRole("heading", { name: "Sign in" }),
        ).toBeVisible();
        await signInPage.screenshot({
          path: screenshotPath("admin-sign-in", viewportName, theme),
          fullPage: true,
        });
        await signInPage.close();

        const forbiddenPage = await browser.newPage({ viewport });
        await openThemedPage(forbiddenPage, theme);
        await openAdminSupport(forbiddenPage, { admin: false });
        await forbiddenPage.goto("/admin/support");
        await expect(
          forbiddenPage.getByRole("heading", { name: "Not authorised" }),
        ).toBeVisible();
        await forbiddenPage.screenshot({
          path: screenshotPath("admin-not-authorised", viewportName, theme),
          fullPage: true,
        });
        await forbiddenPage.close();

        const listPage = await browser.newPage({ viewport });
        await openThemedPage(listPage, theme);
        await openAdminSupport(listPage, { admin: true });
        await installAdminSupportApiMocks(listPage);
        await listPage.goto("/admin/support");
        await expect(
          listPage.getByRole("heading", { name: "Support inbox" }),
        ).toBeVisible();
        await expect(
          listPage.getByRole("button", { name: "Bug from user@example.com" }),
        ).toBeVisible();
        await listPage.screenshot({
          path: screenshotPath("admin-inbox-list", viewportName, theme),
          fullPage: true,
        });
        await listPage.close();

        const threadPage = await browser.newPage({ viewport });
        await openThemedPage(threadPage, theme);
        await openAdminSupport(threadPage, { admin: true });
        await installAdminSupportApiMocks(threadPage, {
          replyEmailStatus: "failed",
        });
        await threadPage.goto("/admin/support");
        await threadPage
          .getByRole("button", { name: "Bug from user@example.com" })
          .click();
        await expect(threadPage.getByText("The upload failed")).toBeVisible();
        await threadPage.getByRole("textbox", { name: "Reply" }).fill(
          "Thanks, we are looking into this.",
        );
        await threadPage.getByRole("button", { name: "Send reply" }).click();
        await expect(threadPage.getByLabel("Email failed")).toBeVisible();
        await threadPage.screenshot({
          path: screenshotPath("admin-thread-failed-email", viewportName, theme),
          fullPage: true,
        });
        await threadPage.close();

        const homePage = await browser.newPage({ viewport });
        await openThemedPage(homePage, theme);
        await homePage.goto("/");
        await expect(
          homePage.getByRole("heading", {
            name: "Your closet, beautifully organized",
          }),
        ).toBeVisible();
        await homePage.screenshot({
          path: screenshotPath("home", viewportName, theme),
          fullPage: true,
        });
        await homePage.close();
      }
    }
  });
});
