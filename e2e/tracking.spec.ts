import { expect, test, type Page } from "@playwright/test";
import { installTrackingApiMocks } from "./trackingApiMock";
import {
  blockPixelNetwork,
  clickStoreCta,
  countTrackingEvent,
  expectNoPixelScripts,
  findGtagEvents,
  findTrackingEvent,
  expectHashedExternalIdOnly,
  installTrackingStubs,
  mockFirebaseEmailAuth,
  openTrackedSignedInHome,
  readTrackingCalls,
  seedConsent,
  waitForTrackingEvent,
} from "./trackingHelpers";
import { E2E_USER_EMAIL } from "./env";

const setupTrackedApp = async (
  page: Page,
  options: Parameters<typeof installTrackingApiMocks>[1] = {},
): Promise<void> => {
  await blockPixelNetwork(page);
  await installTrackingStubs(page);
  await installTrackingApiMocks(page, options);
};

const expectViewPayload = (
  payload: unknown,
  expected: Record<string, unknown>,
): void => {
  expect(payload).toEqual(expected);
  const serialized = JSON.stringify(payload);
  expect(serialized).not.toMatch(/@/);
  expect(serialized).not.toContain("Black loafers");
  expect(serialized).not.toContain("Sunday brunch");
  expect(serialized).not.toContain("Navy tee");
  expect(serialized).not.toMatch(
    /wish_loafers01|outfit_brunch01|item_navytee01|wd_weekend01/,
  );
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
    await expect(
      page.getByRole("heading", { name: "Create account" }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Email" }).fill(E2E_USER_EMAIL);
    await page
      .getByRole("textbox", { name: "Password", exact: true })
      .fill("password1");
    await page.getByRole("textbox", { name: "Confirm password" }).fill("password1");
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
    await expectHashedExternalIdOnly(page);

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await waitForTrackingEvent(page, "fbq", "Logout");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await page.getByRole("textbox", { name: "Email" }).fill(E2E_USER_EMAIL);
    await page
      .getByRole("textbox", { name: "Password", exact: true })
      .fill("password1");
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
    await expectHashedExternalIdOnly(page);
  });

  test("records creating a wardrobe, adding an item, and saving an outfit", async ({
    page,
  }) => {
    await setupTrackedApp(page);
    await openTrackedSignedInHome(page);

    await page.getByRole("link", { name: "Add a wardrobe" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Add wardrobe" }),
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
      page.getByRole("heading", { level: 1, name: "Add clothing item" }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Name" }).fill("Navy tee");
    await page.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Top" }).click();
    await page.getByLabel("Photo", { exact: true }).setInputFiles({
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
      page.getByRole("heading", { level: 1, name: "Add outfit" }),
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
    const wishDetail = page.getByRole("dialog", { name: "Wanted coat" });
    await expect(wishDetail).toBeVisible();
    await wishDetail
      .getByRole("button", { name: "Mark this wish as owned" })
      .click();
    await waitForTrackingEvent(page, "fbq", "WishlistMarkOwned");
    await waitForTrackingEvent(page, "gtag", "wishlist_mark_owned");
  });

  test("records InitiateCheckout then Subscribe once on success return", async ({
    page,
  }) => {
    await setupTrackedApp(page);
    await openTrackedSignedInHome(page);
    await expectHashedExternalIdOnly(page);

    await page.goto("/app/pricing");
    await expect(
      page.getByRole("heading", { level: 1, name: "Pricing" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Upgrade to Basic" }).click();

    await expect(
      page.getByRole("heading", { name: "You are subscribed" }),
    ).toBeVisible();
    await waitForTrackingEvent(page, "fbq", "InitiateCheckout");
    await waitForTrackingEvent(page, "gtag", "begin_checkout");
    await waitForTrackingEvent(page, "ttq", "InitiateCheckout");
    const subscribe = await waitForTrackingEvent(page, "fbq", "Subscribe");
    expect(subscribe[3]).toEqual(
      expect.objectContaining({ eventID: "stripe_cs_test_e2e" }),
    );
    const tiktokSubscribe = await waitForTrackingEvent(
      page,
      "ttq",
      "Subscribe",
    );
    expect(tiktokSubscribe[2]).toEqual(
      expect.objectContaining({ event_id: "stripe_cs_test_e2e" }),
    );

    await page.reload();
    await expect(
      page.getByRole("heading", { name: "You are subscribed" }),
    ).toBeVisible();
    const calls = await readTrackingCalls(page);
    expect(countTrackingEvent(calls, "fbq", "Subscribe")).toBe(1);
    expect(countTrackingEvent(calls, "ttq", "Subscribe")).toBe(1);
    expect(findTrackingEvent(calls, "fbq", "StartTrial")).toBeUndefined();
    expect(findTrackingEvent(calls, "ttq", "StartTrial")).toBeUndefined();
  });

  test("fires Subscribe once from /app/billing/success?session_id=cs_test_123", async ({
    page,
  }) => {
    await blockPixelNetwork(page);
    await installTrackingStubs(page);
    await installTrackingApiMocks(page, { startSubscribed: true });
    await openTrackedSignedInHome(page);

    await page.goto("/app/billing/success?session_id=cs_test_123");
    await expect(
      page.getByRole("heading", { name: "You are subscribed" }),
    ).toBeVisible();

    const subscribe = await waitForTrackingEvent(page, "fbq", "Subscribe");
    expect(subscribe[3]).toEqual(
      expect.objectContaining({ eventID: "stripe_cs_test_123" }),
    );
    expect(subscribe[2]).not.toEqual(
      expect.objectContaining({ session_id: expect.anything() }),
    );
    expect(JSON.stringify(subscribe[2])).not.toContain("cs_test_123");

    const tiktokSubscribe = await waitForTrackingEvent(
      page,
      "ttq",
      "Subscribe",
    );
    expect(tiktokSubscribe[2]).toEqual(
      expect.objectContaining({ event_id: "stripe_cs_test_123" }),
    );
    expect(JSON.stringify(tiktokSubscribe[1])).not.toContain("cs_test_123");

    await page.reload();
    await expect(
      page.getByRole("heading", { name: "You are subscribed" }),
    ).toBeVisible();
    const calls = await readTrackingCalls(page);
    expect(countTrackingEvent(calls, "fbq", "Subscribe")).toBe(1);
    expect(countTrackingEvent(calls, "ttq", "Subscribe")).toBe(1);
    expect(findTrackingEvent(calls, "fbq", "StartTrial")).toBeUndefined();
    expect(findTrackingEvent(calls, "ttq", "StartTrial")).toBeUndefined();
  });

  test("fires Subscribe once from /app/billing/success?session_id=cs_live_abc123", async ({
    page,
  }) => {
    await blockPixelNetwork(page);
    await installTrackingStubs(page);
    await installTrackingApiMocks(page, { startSubscribed: true });
    await openTrackedSignedInHome(page);

    await page.goto("/app/billing/success?session_id=cs_live_abc123");
    await expect(
      page.getByRole("heading", { name: "You are subscribed" }),
    ).toBeVisible();

    const subscribe = await waitForTrackingEvent(page, "fbq", "Subscribe");
    expect(subscribe[3]).toEqual(
      expect.objectContaining({ eventID: "stripe_cs_live_abc123" }),
    );
    expect(JSON.stringify(subscribe[2])).not.toContain("cs_live_abc123");

    const tiktokSubscribe = await waitForTrackingEvent(
      page,
      "ttq",
      "Subscribe",
    );
    expect(tiktokSubscribe[2]).toEqual(
      expect.objectContaining({ event_id: "stripe_cs_live_abc123" }),
    );
    expect(JSON.stringify(tiktokSubscribe[1])).not.toContain("cs_live_abc123");

    await page.reload();
    await expect(
      page.getByRole("heading", { name: "You are subscribed" }),
    ).toBeVisible();
    const calls = await readTrackingCalls(page);
    expect(countTrackingEvent(calls, "fbq", "Subscribe")).toBe(1);
    expect(countTrackingEvent(calls, "ttq", "Subscribe")).toBe(1);
  });
});

test.describe("view events", () => {
  test("records view_wish once per open and twice after reopen", async ({
    page,
  }) => {
    await setupTrackedApp(page, { seedWish: true, startSubscribed: true });
    await openTrackedSignedInHome(page);

    await page.getByRole("button", { name: "Black loafers" }).click();
    const firstDetail = page.getByRole("dialog", { name: "Black loafers" });
    await expect(firstDetail).toBeVisible();

    const firstWish = await waitForTrackingEvent(page, "gtag", "view_wish");
    expectViewPayload(firstWish[2], {
      content_type: "wish",
      category: "SHOES",
    });
    await waitForTrackingEvent(page, "fbq", "ViewContent");
    await waitForTrackingEvent(page, "ttq", "ViewContent");

    await firstDetail.getByRole("button", { name: "Close" }).click();
    await expect(
      page.getByRole("dialog", { name: "Black loafers" }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Black loafers" }).click();
    await expect(
      page.getByRole("dialog", { name: "Black loafers" }),
    ).toBeVisible();
    await expect
      .poll(async () => {
        const calls = await readTrackingCalls(page);
        return findGtagEvents(calls, "view_wish").length;
      })
      .toBe(2);

    const calls = await readTrackingCalls(page);
    const wishEvents = findGtagEvents(calls, "view_wish");
    expect(wishEvents).toHaveLength(2);
    expectViewPayload(wishEvents[1]?.[2], {
      content_type: "wish",
      category: "SHOES",
    });
  });

  test("records view_outfit on the outfit detail screen", async ({ page }) => {
    await setupTrackedApp(page, { seedOutfit: true, startSubscribed: true });
    await openTrackedSignedInHome(page);

    await page.goto("/app/outfits/outfit_brunch01/edit?wardrobeId=wd_weekend01");
    await expect(
      page.getByRole("heading", { level: 1, name: "Edit outfit" }),
    ).toBeVisible();

    const outfit = await waitForTrackingEvent(page, "gtag", "view_outfit");
    expectViewPayload(outfit[2], { content_type: "outfit" });
    const calls = await readTrackingCalls(page);
    expect(findGtagEvents(calls, "view_outfit")).toHaveLength(1);
  });

  test("records view_try_on on the Virtual Try On screen", async ({ page }) => {
    await setupTrackedApp(page, { seedOutfit: true, startSubscribed: true });
    await openTrackedSignedInHome(page);

    await page.goto("/app/virtual-try-on");
    await expect(
      page.getByRole("heading", { level: 1, name: "Virtual Try On" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start Virtual Try On" }),
    ).toBeVisible();

    const tryOn = await waitForTrackingEvent(page, "gtag", "view_try_on");
    expectViewPayload(tryOn[2], { content_type: "try_on" });
    const calls = await readTrackingCalls(page);
    expect(findGtagEvents(calls, "view_try_on")).toHaveLength(1);
    expect(JSON.stringify(tryOn)).not.toMatch(/AI/i);
  });

  test("records view_recommendations only after a successful load", async ({
    page,
  }) => {
    await setupTrackedApp(page, { startSubscribed: true });
    await openTrackedSignedInHome(page);

    await page.goto("/app/wardrobes/wd_weekend01/recommendations");
    await expect(
      page.getByRole("heading", { level: 1, name: "Suggested outfits" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Navy + cream look" }),
    ).toBeVisible();

    const recommendations = await waitForTrackingEvent(
      page,
      "gtag",
      "view_recommendations",
    );
    expectViewPayload(recommendations[2], {
      content_type: "recommendations",
      result_count: 2,
    });
  });

  test("does not record view_recommendations on a 403 paywall", async ({
    page,
  }) => {
    await setupTrackedApp(page, {
      startSubscribed: true,
      recommendationsStatus: 403,
    });
    await openTrackedSignedInHome(page);
    await page.goto("/app/wardrobes/wd_weekend01/recommendations");
    await expect(
      page.getByRole("heading", {
        name: "Suggested outfits need a paid plan",
      }),
    ).toBeVisible();
    const calls = await readTrackingCalls(page);
    expect(findGtagEvents(calls, "view_recommendations")).toHaveLength(0);
  });

  test("does not record view_recommendations on a 429", async ({ page }) => {
    await setupTrackedApp(page, {
      startSubscribed: true,
      recommendationsStatus: 429,
    });
    await openTrackedSignedInHome(page);
    await page.goto("/app/wardrobes/wd_weekend01/recommendations");
    await expect(
      page.getByRole("heading", { name: "Couldn't load suggested outfits" }),
    ).toBeVisible();
    const calls = await readTrackingCalls(page);
    expect(findGtagEvents(calls, "view_recommendations")).toHaveLength(0);
  });

  test("does not record view_recommendations while the request is loading", async ({
    page,
  }) => {
    await setupTrackedApp(page, {
      startSubscribed: true,
      holdRecommendations: true,
    });
    await openTrackedSignedInHome(page);
    await page.goto("/app/wardrobes/wd_weekend01/recommendations");
    await expect(
      page.getByRole("status", { name: "Loading suggested outfits" }),
    ).toBeVisible();
    const calls = await readTrackingCalls(page);
    expect(findGtagEvents(calls, "view_recommendations")).toHaveLength(0);
  });

  test("does not record view events when consent is denied", async ({
    page,
  }) => {
    await blockPixelNetwork(page);
    await installTrackingStubs(page);
    await seedConsent(page, { analytics: false, marketing: false });
    await installTrackingApiMocks(page, {
      seedWish: true,
      seedOutfit: true,
      startSubscribed: true,
    });
    await openTrackedSignedInHome(page);

    await page.getByRole("button", { name: "Black loafers" }).click();
    await expect(
      page.getByRole("dialog", { name: "Black loafers" }),
    ).toBeVisible();
    await page.goto("/app/outfits/outfit_brunch01/edit?wardrobeId=wd_weekend01");
    await expect(
      page.getByRole("heading", { level: 1, name: "Edit outfit" }),
    ).toBeVisible();
    await page.goto("/app/virtual-try-on");
    await expect(
      page.getByRole("heading", { level: 1, name: "Virtual Try On" }),
    ).toBeVisible();
    await page.goto("/app/wardrobes/wd_weekend01/recommendations");
    await expect(
      page.getByRole("heading", { level: 1, name: "Suggested outfits" }),
    ).toBeVisible();

    const calls = await readTrackingCalls(page);
    expect(findGtagEvents(calls, "view_wish")).toHaveLength(0);
    expect(findGtagEvents(calls, "view_outfit")).toHaveLength(0);
    expect(findGtagEvents(calls, "view_try_on")).toHaveLength(0);
    expect(findGtagEvents(calls, "view_recommendations")).toHaveLength(0);
    expect(countTrackingEvent(calls, "fbq", "ViewContent")).toBe(0);
  });

  test("does not record view events when tracking IDs are blank", async ({
    page,
  }) => {
    await blockPixelNetwork(page);
    await seedConsent(page);
    await installTrackingApiMocks(page, {
      seedWish: true,
      seedOutfit: true,
      startSubscribed: true,
    });
    await openTrackedSignedInHome(page);

    await page.getByRole("button", { name: "Black loafers" }).click();
    await expect(
      page.getByRole("dialog", { name: "Black loafers" }),
    ).toBeVisible();
    await page.goto("/app/virtual-try-on");
    await expect(
      page.getByRole("heading", { level: 1, name: "Virtual Try On" }),
    ).toBeVisible();

    expect(await page.evaluate(() => typeof window.gtag)).toBe("undefined");
    expect(await page.evaluate(() => typeof window.fbq)).toBe("undefined");
    const calls = await readTrackingCalls(page);
    expect(calls.gtag).toEqual([]);
    expect(calls.fbq).toEqual([]);
    expect(calls.ttq).toEqual([]);
  });
});
