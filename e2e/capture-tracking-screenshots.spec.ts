import { expect, test, type Page } from "@playwright/test";
import {
  blockPixelNetwork,
  clickStoreCta,
  installTrackingStubs,
  waitForTrackingEvent,
} from "./trackingHelpers";

const shouldCapture = process.env.CAPTURE_SCREENSHOTS === "1";
const capturePhase = process.env.CAPTURE_PHASE === "before" ? "before" : "after";

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const;

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
  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { level: 1, name: "Privacy Policy" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Mobile advertising and attribution" }),
  ).toBeVisible();
};

const screenshotPath = (
  viewport: keyof typeof viewports,
  theme: "light" | "dark",
  suffix = "",
): string => {
  const themeSuffix = theme === "dark" ? "-dark" : "";
  return `docs/screenshots/WARDROBE-248/privacy-${viewport}-${capturePhase}${suffix}${themeSuffix}.png`;
};

test.describe("WARDROBE-248 screenshot capture", () => {
  test.skip(
    !shouldCapture,
    "Set CAPTURE_SCREENSHOTS=1 to refresh docs/screenshots/WARDROBE-248.",
  );

  test("captures privacy policy advertising section", async ({
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
        await page
          .getByRole("heading", { name: "Mobile advertising and attribution" })
          .scrollIntoViewIfNeeded();
        await page.screenshot({
          path: screenshotPath(viewportName, theme, "-section"),
          fullPage: false,
        });
        await page.close();
      }
    }
  });

  test("captures debug console events", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium" || capturePhase === "before",
      "Debug console is captured once on the after pass.",
    );

    const lines: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "debug" || message.text().includes("[tracking]")) {
        lines.push(message.text());
      }
    });

    await blockPixelNetwork(page);
    await installTrackingStubs(page);
    await page.goto("/");
    await clickStoreCta(page);
    await waitForTrackingEvent(page, "fbq", "StoreCtaClick");

    await expect
      .poll(() => lines.some((line) => line.includes("[tracking]")))
      .toBe(true);

    await page.evaluate((consoleLines) => {
      document.documentElement.innerHTML = "";
      const pre = document.createElement("pre");
      pre.id = "tracking-debug-console";
      pre.setAttribute("aria-label", "Tracking debug console");
      pre.style.margin = "0";
      pre.style.padding = "24px";
      pre.style.minHeight = "100vh";
      pre.style.background = "#111";
      pre.style.color = "#d6f5d6";
      pre.style.fontFamily =
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      pre.style.fontSize = "13px";
      pre.style.whiteSpace = "pre-wrap";
      pre.textContent = consoleLines.join("\n");
      document.body.appendChild(pre);
    }, lines);

    await expect(
      page.getByLabel("Tracking debug console"),
    ).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.screenshot({
      path: "docs/screenshots/WARDROBE-248/debug-console.png",
      fullPage: true,
    });
  });
});
