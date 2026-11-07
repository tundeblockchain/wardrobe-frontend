import { expect, test, type Page } from "@playwright/test";

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
  return `docs/screenshots/WARDROBE-251/${scene}-${viewport}-${capturePhase}${themeSuffix}.png`;
};

const openLanding = async (
  page: Page,
  theme: "light" | "dark",
): Promise<void> => {
  await setTheme(page, theme);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
};

const openPrivacy = async (
  page: Page,
  theme: "light" | "dark",
): Promise<void> => {
  await setTheme(page, theme);
  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { level: 1, name: "Privacy Policy" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Cookies and similar technologies" }),
  ).toBeVisible();
};

test.describe("WARDROBE-251 screenshot capture", () => {
  test.skip(
    !shouldCapture,
    "Set CAPTURE_SCREENSHOTS=1 to refresh docs/screenshots/WARDROBE-251.",
  );

  test("captures banner, preferences, footer, and privacy cookies", async ({
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

        const landing = await browser.newPage({ viewport });
        await openLanding(landing, theme);
        if (capturePhase === "after") {
          await expect(
            landing.getByRole("dialog", { name: "Cookies on Pocket Closet" }),
          ).toBeVisible();
        } else {
          await expect(
            landing.getByRole("dialog", { name: "Cookies on Pocket Closet" }),
          ).toHaveCount(0);
        }
        await landing.screenshot({
          path: screenshotPath("banner", viewportName, theme),
          fullPage: false,
        });

        if (capturePhase === "after") {
          await landing
            .getByRole("button", { name: "Manage cookie preferences" })
            .click();
          await expect(
            landing.getByRole("dialog", { name: "Cookie preferences" }),
          ).toBeVisible();
          await landing.screenshot({
            path: screenshotPath("preferences", viewportName, theme),
            fullPage: false,
          });
        } else {
          await landing.screenshot({
            path: screenshotPath("preferences", viewportName, theme),
            fullPage: false,
          });
        }
        await landing.close();

        const footerPage = await browser.newPage({ viewport });
        await openLanding(footerPage, theme);
        if (capturePhase === "after") {
          await footerPage
            .getByRole("button", { name: "Reject all optional cookies" })
            .click();
          await expect(
            footerPage.getByRole("dialog", { name: "Cookies on Pocket Closet" }),
          ).toHaveCount(0);
        }
        await footerPage
          .getByRole("contentinfo")
          .scrollIntoViewIfNeeded();
        if (capturePhase === "after") {
          await expect(
            footerPage.getByRole("button", { name: "Cookie settings" }),
          ).toBeVisible();
        }
        await footerPage.screenshot({
          path: screenshotPath("footer", viewportName, theme),
          fullPage: false,
        });
        await footerPage.close();

        const privacy = await browser.newPage({ viewport });
        await openPrivacy(privacy, theme);
        if (capturePhase === "after") {
          await privacy
            .getByRole("button", { name: "Reject all optional cookies" })
            .click();
          await expect(
            privacy.getByRole("dialog", { name: "Cookies on Pocket Closet" }),
          ).toHaveCount(0);
          await expect(
            privacy.getByText("Last updated 7 November 2026"),
          ).toBeVisible();
          await expect(
            privacy.getByRole("button", { name: "Cookie settings" }).first(),
          ).toBeVisible();
        } else {
          await expect(
            privacy.getByText("Last updated 6 November 2026"),
          ).toBeVisible();
        }
        await privacy
          .getByRole("heading", { name: "Cookies and similar technologies" })
          .scrollIntoViewIfNeeded();
        if (capturePhase === "after") {
          await privacy
            .getByRole("button", { name: "Cookie settings" })
            .first()
            .scrollIntoViewIfNeeded();
        }
        await privacy.screenshot({
          path: screenshotPath("privacy", viewportName, theme),
          fullPage: false,
        });
        await privacy.close();
      }
    }
  });
});
