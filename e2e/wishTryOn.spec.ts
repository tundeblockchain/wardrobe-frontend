import { expect, test, type Page, type Request } from "@playwright/test";
import {
  mockFirebaseAuthNetwork,
  openSignedInHome,
  seedFirebaseAuth,
} from "./signedInApp";
import { seedConsent } from "./trackingHelpers";
import {
  categoryOnlyWish,
  httpsWish,
  imageOnlyWish,
  installWishlistApiMocks,
  premiumEntitlement,
  tryOnHistoryWish,
  weekendWardrobe,
  type WishlistMockOptions,
} from "./wishlistApiMock";

const READY_RENDER = {
  status: "READY" as const,
  aiProfileId: "aip_model01",
  imageKey: "users/e2e/wishlist/wish_loafers01/renders/rend_ready.png",
  imageUrl: "/screenshots/try-on-rust-floral-390.jpg",
};

const FAILED_RENDER = {
  status: "FAILED" as const,
  aiProfileId: "aip_model01",
  error: "The Virtual Try On render could not be created.",
};

const openHome = async (
  page: Page,
  options?: WishlistMockOptions,
): Promise<void> => {
  await seedConsent(page, { analytics: false, marketing: false });
  await seedFirebaseAuth(page);
  await mockFirebaseAuthNetwork(page);
  await installWishlistApiMocks(page, options);
  await openSignedInHome(page);
};

const renderPosts = (requests: Request[]): Request[] => {
  return requests.filter((request) => {
    return (
      request.method() === "POST" &&
      /\/wishlist\/[^/]+\/render$/.test(new URL(request.url()).pathname)
    );
  });
};

test.describe("Wish detail Virtual Try On", () => {
  test("generates, polls, and shows a READY image", async ({ page }) => {
    const posts: Request[] = [];
    page.on("request", (request) => {
      posts.push(request);
    });
    await openHome(page, {
      wishes: [httpsWish],
      wardrobes: [weekendWardrobe],
      entitlement: premiumEntitlement,
      tryOnPoll: [
        { status: "PROCESSING", aiProfileId: "aip_model01" },
        READY_RENDER,
      ],
    });

    await page.getByRole("button", { name: "Black loafers" }).click();
    const detail = page.getByRole("dialog", { name: "Black loafers" });
    await expect(detail).toBeVisible();
    await detail.getByRole("button", { name: "Virtual Try On this wish" }).click();

    await expect(
      page.getByRole("status", { name: "Creating your try-on…" }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", READY_RENDER.imageUrl, { timeout: 15_000 });

    const generate = renderPosts(posts);
    expect(generate).toHaveLength(1);
    expect(generate[0]?.postDataJSON()).toEqual({
      aiProfileId: "aip_model01",
    });
    expect(JSON.stringify(generate[0]?.postDataJSON())).not.toMatch(
      /imageUrl|originalImageUrl/,
    );
  });

  test("shows FAILED and retries until READY", async ({ page }) => {
    await openHome(page, {
      wishes: [httpsWish],
      wardrobes: [weekendWardrobe],
      entitlement: premiumEntitlement,
      tryOnPoll: [FAILED_RENDER, READY_RENDER],
    });

    await page.getByRole("button", { name: "Black loafers" }).click();
    await page
      .getByRole("button", { name: "Virtual Try On this wish" })
      .click();

    await expect(
      page.getByRole("alert", { name: "Couldn't create this try-on" }),
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Retry Virtual Try On" }).click();
    await expect(
      page.getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", READY_RENDER.imageUrl, { timeout: 15_000 });
  });

  test("prompts for a photo and does not POST", async ({ page }) => {
    const posts: Request[] = [];
    page.on("request", (request) => {
      posts.push(request);
    });
    await openHome(page, {
      wishes: [categoryOnlyWish],
      wardrobes: [weekendWardrobe],
      entitlement: premiumEntitlement,
    });

    await page.getByRole("button", { name: "Forest scarf" }).click();
    await page
      .getByRole("button", { name: "Virtual Try On this wish" })
      .click();

    await expect(
      page.getByText("Virtual Try On needs a photo. Add one, then try again."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add the missing photo or category" }),
    ).toBeVisible();
    expect(renderPosts(posts)).toHaveLength(0);
  });

  test("prompts for a category and does not POST", async ({ page }) => {
    const posts: Request[] = [];
    page.on("request", (request) => {
      posts.push(request);
    });
    await openHome(page, {
      wishes: [imageOnlyWish],
      wardrobes: [weekendWardrobe],
      entitlement: premiumEntitlement,
    });

    await page.getByRole("button", { name: "Linen shirt" }).click();
    await page
      .getByRole("button", { name: "Virtual Try On this wish" })
      .click();

    await expect(
      page.getByText(
        "Virtual Try On needs a category. Pick one, then try again.",
      ),
    ).toBeVisible();
    expect(renderPosts(posts)).toHaveLength(0);
  });

  test("maps 400 WISH_IMAGE_REQUIRED from the server", async ({ page }) => {
    await openHome(page, {
      wishes: [httpsWish],
      wardrobes: [weekendWardrobe],
      entitlement: premiumEntitlement,
      tryOnGenerateError: {
        status: 400,
        code: "WISH_IMAGE_REQUIRED",
        message: "Wish needs a photo.",
      },
    });

    await page.getByRole("button", { name: "Black loafers" }).click();
    await page
      .getByRole("button", { name: "Virtual Try On this wish" })
      .click();

    await expect(
      page.getByText("Virtual Try On needs a photo. Add one, then try again."),
    ).toBeVisible();
  });

  test("maps 400 WISH_CATEGORY_REQUIRED from the server", async ({ page }) => {
    await openHome(page, {
      wishes: [httpsWish],
      wardrobes: [weekendWardrobe],
      entitlement: premiumEntitlement,
      tryOnGenerateError: {
        status: 400,
        code: "WISH_CATEGORY_REQUIRED",
        message: "Wish needs a category.",
      },
    });

    await page.getByRole("button", { name: "Black loafers" }).click();
    await page
      .getByRole("button", { name: "Virtual Try On this wish" })
      .click();

    await expect(
      page.getByText(
        "Virtual Try On needs a category. Pick one, then try again.",
      ),
    ).toBeVisible();
  });

  test("shows the Premium paywall on Free without posting", async ({ page }) => {
    const posts: Request[] = [];
    page.on("request", (request) => {
      posts.push(request);
    });
    await openHome(page, {
      wishes: [httpsWish],
      wardrobes: [weekendWardrobe],
    });

    await page.getByRole("button", { name: "Black loafers" }).click();
    await page
      .getByRole("button", { name: "Virtual Try On this wish" })
      .click();

    await expect(
      page.getByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    ).toBeVisible();
    expect(renderPosts(posts)).toHaveLength(0);
  });

  test("shows history from renderHistory and deletes a photo", async ({
    page,
  }) => {
    await openHome(page, {
      wishes: [tryOnHistoryWish],
      wardrobes: [weekendWardrobe],
    });

    await page.getByRole("button", { name: "History loafers" }).click();
    const result = page.getByRole("region", { name: "Virtual Try On result" });
    await expect(result.getByRole("img", { name: "Virtual Try On render 1" })).toHaveAttribute(
      "src",
      "/screenshots/try-on-rust-floral-390.jpg",
    );
    const gallery = page.getByRole("region", { name: "Try On photos" });
    await expect(
      gallery.getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-ivory-maxi-390.jpg");

    await page
      .getByRole("button", { name: "Delete this Try On photo 1" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Delete this Try On photo?" }),
    ).toBeVisible();
    const deleteResponse = page.waitForResponse((response) => {
      return (
        response.request().method() === "DELETE" &&
        /\/wishlist\/[^/]+\/renders$/.test(new URL(response.url()).pathname)
      );
    });
    await page.getByRole("button", { name: "Delete photo" }).click();
    await deleteResponse;

    const resultAfter = page.getByRole("region", {
      name: "Virtual Try On result",
    });
    await expect(
      resultAfter.getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-ivory-maxi-390.jpg");
    await expect(
      page.getByRole("heading", { name: "Try On photos" }),
    ).toHaveCount(0);
  });
});
