import { expect, test, type Page } from "@playwright/test";
import { installTrackingApiMocks } from "./trackingApiMock";
import {
  blockPixelNetwork,
  clickStoreCta,
  countTrackingEvent,
  expectNoPixelScripts,
  findTrackingEvent,
  installTrackingStubs,
  mockFirebaseEmailAuth,
  openTrackedSignedInHome,
  readTrackingCalls,
  waitForTrackingEvent,
} from "./trackingHelpers";
import { E2E_USER_EMAIL } from "./env";

const setupTrackedApp = async (page: Page): Promise<void> => {
  await blockPixelNetwork(page);
  await installTrackingStubs(page);
  await installTrackingApiMocks(page);
};

test.describe("tracking pixels", () => {
  test("loads no pixel scripts and fires nothing when env IDs are unset", async ({
    page,
  }) => {
    await blockPixelNetwork(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoPixelScripts(page);

    expect(await page.evaluate(() => typeof window.gtag)).toBe("undefined");
    expect(await page.evaluate(() => typeof window.fbq)).toBe("undefined");
    expect(await page.evaluate(() => typeof window.ttq)).toBe("undefined");

    await clickStoreCta(page);

    expect(await page.evaluate(() => typeof window.gtag)).toBe("undefined");
    expect(await page.evaluate(() => typeof window.fbq)).toBe("undefined");
    expect(await page.evaluate(() => typeof window.ttq)).toBe("undefined");
    await expectNoPixelScripts(page);
  });

  test("records a store CTA click on GA, Meta, and TikTok", async ({ page }) => {
    await setupTrackedApp(page);
    await page.goto("/");
    await clickStoreCta(page);

    const ga = await waitForTrackingEvent(page, "gtag", "store_cta_click");
    const meta = await waitForTrackingEvent(page, "fbq", "StoreCtaClick");
    const tiktok = await waitForTrackingEvent(page, "ttq", "ClickButton");

    expect(ga[2]).toEqual({ store: "appStore", placement: "hero" });
    expect(meta[0]).toBe("trackCustom");
    expect(meta[2]).toEqual({ store: "appStore", placement: "hero" });
    expect(meta[3]).toEqual(
      expect.objectContaining({ eventID: expect.any(String) }),
    );
    expect(tiktok[1]).toEqual({ store: "appStore", placement: "hero" });
    expect(tiktok[2]).toEqual(
      expect.objectContaining({ event_id: expect.any(String) }),
    );
    expect(JSON.stringify([ga, meta, tiktok])).not.toMatch(/@/);
  });

  test("records sign-up and login without personal data", async ({ page }) => {
    await blockPixelNetwork(page);
    await installTrackingStubs(page);
    await installTrackingApiMocks(page);
    await mockFirebaseEmailAuth(page);

    await page.goto("/login?mode=signup");
    await page.getByLabel("Email").fill(E2E_USER_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill("password1");
    await page.getByLabel("Confirm password").fill("password1");
    await page.getByRole("button", { name: "Create account" }).click();

    const signUp = await waitForTrackingEvent(
      page,
      "fbq",
      "CompleteRegistration",
    );
    expect(signUp[0]).toBe("track");
    expect(JSON.stringify(signUp)).not.toMatch(/@|password/i);
    await waitForTrackingEvent(page, "gtag", "sign_up");
    await waitForTrackingEvent(page, "ttq", "CompleteRegistration");
    await expect(
      page.getByRole("heading", { level: 1, name: "Your closet" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await waitForTrackingEvent(page, "fbq", "Logout");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();

    await page.goto("/login");
    await page.getByLabel("Email").fill(E2E_USER_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill("password1");
    await page.getByRole("button", { name: "Sign in with email" }).click();
    await waitForTrackingEvent(page, "fbq", "Login");
    await waitForTrackingEvent(page, "gtag", "login");
    await waitForTrackingEvent(page, "ttq", "Login");
    const login = await findTrackingEvent(
      await readTrackingCalls(page),
      "fbq",
      "Login",
    );
    expect(JSON.stringify(login)).not.toMatch(/@|password/i);
  });

  test("records creating a wardrobe, adding an item, and saving an outfit", async ({
    page,
  }) => {
    await setupTrackedApp(page);
    await openTrackedSignedInHome(page);

    await page.getByRole("link", { name: "Add a wardrobe" }).click();
    await expect(
      page.getByRole("heading", { name: "Add wardrobe" }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Name" }).fill("Travel");
    await page.getByRole("button", { name: "Save wardrobe" }).click();
    await waitForTrackingEvent(page, "fbq", "CreateWardrobe");
    await waitForTrackingEvent(page, "gtag", "create_wardrobe");
    await waitForTrackingEvent(page, "ttq", "CreateWardrobe");
    await expect(page.getByRole("heading", { name: "Travel" })).toBeVisible();

    await page
      .getByRole("link", { name: "Add a clothing item to this wardrobe" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Add clothing item" }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Name" }).fill("Navy tee");
    await page.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Top" }).click();
    await page.getByLabel("Photo").setInputFiles({
      name: "tee.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fake-image"),
    });
    await page.getByRole("button", { name: "Save item" }).click();
    await waitForTrackingEvent(page, "fbq", "ItemImageUploaded");
    await waitForTrackingEvent(page, "fbq", "AddItem");
    await waitForTrackingEvent(page, "gtag", "add_item");
    await waitForTrackingEvent(page, "ttq", "AddItem");

    await page.goto("/app/outfits/new");
    await expect(
      page.getByRole("heading", { name: "Add outfit" }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Name" }).fill("Cafe look");
    await page.getByRole("combobox", { name: "Wardrobe" }).click();
    await page.getByRole("option", { name: "Weekend closet" }).click();
    await page.getByRole("checkbox", { name: /Navy tee/ }).click();
    await page.getByRole("button", { name: "Save outfit" }).click();
    await waitForTrackingEvent(page, "fbq", "SaveOutfit");
    await waitForTrackingEvent(page, "gtag", "save_outfit");
    await waitForTrackingEvent(page, "ttq", "SaveOutfit");
  });

  test("records wish list add and mark owned", async ({ page }) => {
    await setupTrackedApp(page);
    await openTrackedSignedInHome(page);

    await page.getByRole("button", { name: "Add to wish list" }).click();
    await expect(
      page.getByRole("heading", { name: "Add to wish list" }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Name" }).fill("Wanted coat");
    await page.getByRole("button", { name: "Save wish" }).click();
    await waitForTrackingEvent(page, "fbq", "AddToWishlist");
    await waitForTrackingEvent(page, "gtag", "add_to_wishlist");
    await waitForTrackingEvent(page, "ttq", "AddToWishlist");

    await page.getByRole("button", { name: "Wanted coat" }).click();
    await page.getByRole("button", { name: "Mark this wish as owned" }).click();
    await waitForTrackingEvent(page, "fbq", "WishlistMarkOwned");
    await waitForTrackingEvent(page, "gtag", "wishlist_mark_owned");
  });

  test("records InitiateCheckout then Subscribe once on success return", async ({
    page,
  }) => {
    await setupTrackedApp(page);
    await openTrackedSignedInHome(page);

    await page.goto("/app/pricing");
    await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();
    await page.getByRole("button", { name: "Upgrade to Basic" }).click();

    await waitForTrackingEvent(page, "fbq", "InitiateCheckout");
    await waitForTrackingEvent(page, "gtag", "begin_checkout");
    await waitForTrackingEvent(page, "ttq", "InitiateCheckout");

    await expect(
      page.getByRole("heading", { name: "You are subscribed" }),
    ).toBeVisible();
    const subscribe = await waitForTrackingEvent(page, "fbq", "Subscribe");
    expect(subscribe[3]).toEqual(
      expect.objectContaining({ eventID: "cs_test_e2e" }),
    );
    const tiktokSubscribe = await waitForTrackingEvent(
      page,
      "ttq",
      "Subscribe",
    );
    expect(tiktokSubscribe[2]).toEqual(
      expect.objectContaining({ event_id: "cs_test_e2e" }),
    );

    await page.reload();
    await expect(
      page.getByRole("heading", { name: "You are subscribed" }),
    ).toBeVisible();
    const calls = await readTrackingCalls(page);
    expect(countTrackingEvent(calls, "fbq", "Subscribe")).toBe(1);
    expect(countTrackingEvent(calls, "ttq", "Subscribe")).toBe(1);
    expect(findTrackingEvent(calls, "fbq", "StartTrial")).toBeUndefined();
  });
});
