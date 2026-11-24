import { expect, test, type Page } from "@playwright/test";
import {
  fillContactForm,
  installContactApiMocks,
} from "./contactHelpers";
import { seedConsent } from "./trackingHelpers";

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
  await page.emulateMedia({
    reducedMotion: "reduce",
    colorScheme: theme,
  });
};

const screenshotPath = (
  scene: string,
  viewport: keyof typeof viewports,
  theme: "light" | "dark",
): string => {
  const themeSuffix = theme === "dark" ? "-dark" : "";
  return `docs/screenshots/WARDROBE-283/${scene}-${viewport}-${capturePhase}${themeSuffix}.png`;
};

const openContact = async (
  page: Page,
  theme: "light" | "dark",
): Promise<void> => {
  await setTheme(page, theme);
  await seedConsent(page, { analytics: false, marketing: false });
  await page.goto("/contact");
  await expect(
    page.getByRole("heading", { level: 1, name: "Contact us" }),
  ).toBeVisible();
  await expect(page.getByRole("form", { name: "Contact form" })).toBeVisible();
};

const captureSection = async (
  page: Page,
  scene: string,
  viewportName: keyof typeof viewports,
  theme: "light" | "dark",
): Promise<void> => {
  const section = page.getByRole("article", { name: "Contact us" });
  await expect(section).toBeVisible();
  await section.screenshot({
    path: screenshotPath(scene, viewportName, theme),
  });
};

test.describe("WARDROBE-283 screenshot capture", () => {
  test.skip(
    !shouldCapture,
    "Set CAPTURE_SCREENSHOTS=1 to refresh docs/screenshots/WARDROBE-283.",
  );

  test("captures the contact section", async ({ browser }, testInfo) => {
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

        const idle = await browser.newPage({ viewport });
        await openContact(idle, theme);
        await captureSection(idle, "contact", viewportName, theme);
        await idle.close();

        if (capturePhase !== "after") {
          continue;
        }

        const success = await browser.newPage({ viewport });
        await installContactApiMocks(success);
        await openContact(success, theme);
        await fillContactForm(success);
        await success
          .getByRole("button", { name: "Send contact message" })
          .click();
        await expect(
          success.getByText(
            "Thanks for contacting Pocket Closet. We received your message and will reply if a response is needed.",
          ),
        ).toBeVisible();
        await captureSection(success, "contact-success", viewportName, theme);
        await success.close();

        const error = await browser.newPage({ viewport });
        await installContactApiMocks(error, {
          feedbackStatus: 400,
          feedbackBody: {
            error: "validation",
            fields: { email: "Enter a valid email address." },
          },
        });
        await openContact(error, theme);
        await fillContactForm(error, { email: "ada@example.com" });
        await error
          .getByRole("button", { name: "Send contact message" })
          .click();
        await expect(
          error.getByText("Enter a valid email address."),
        ).toBeVisible();
        await captureSection(error, "contact-error", viewportName, theme);
        await error.close();
      }
    }
  });
});
