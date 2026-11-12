import { expect, test, type Page } from "@playwright/test";
import { E2E_API_ORIGIN } from "./env";
import { PIXEL_HOST_PATTERN, seedConsent } from "./trackingHelpers";

const mockPrivacyPolicyNetwork = async (page: Page): Promise<void> => {
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
  await page.route(
    /identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com/,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      });
    },
  );
};

test.describe("privacy policy", () => {
  test("shows the Android Personalised ads choice", async ({ page }) => {
    await seedConsent(page, { analytics: false, marketing: false });
    await mockPrivacyPolicyNetwork(page);
    await page.goto("/privacy");

    await expect(
      page.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeVisible();
    await expect(
      page.getByText("Last updated 12 November 2026"),
    ).toBeVisible();

    const androidHeading = page.getByRole("heading", {
      name: "Android advertising identifier",
    });
    await androidHeading.scrollIntoViewIfNeeded();
    await expect(androidHeading).toBeVisible();

    await expect(
      page.getByText(/the setting is called “Personalised ads”/),
    ).toBeVisible();
    await expect(
      page.getByText(/lives under Account > Privacy/),
    ).toBeVisible();
    await expect(
      page.getByText(/It is off by default and you can change it at any time/),
    ).toBeVisible();
    await expect(
      page.getByText(/equal Allow and Don’t allow choices/),
    ).toBeVisible();
    await expect(
      page.getByText(/the Account > Privacy switch is what counts/),
    ).toBeVisible();
    await expect(
      page.getByText(
        /does not share the Google advertising ID with Meta or TikTok/,
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        /the operator’s server does not send subscription events to TikTok/,
      ),
    ).toBeVisible();
    await expect(
      page.getByText(/App events can still be sent without the advertising ID/),
    ).toBeVisible();
    await expect(
      page.getByText(/Meta stops using the advertising ID immediately/),
    ).toBeVisible();
    await expect(
      page.getByText(
        /TikTok pauses until the next app launch, then runs without the advertising ID/,
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        /managed in iOS Settings > Privacy & Security > Tracking, not by an in-app switch/,
      ),
    ).toBeVisible();
  });
});
