import { expect, test, type Page } from "@playwright/test";
import {
  mockFirebaseAuthNetwork,
  openSignedInHome,
  seedFirebaseAuth,
} from "./signedInApp";
import {
  httpsWish,
  httpLinkWish,
  incompleteWish,
  installWishlistApiMocks,
  populatedWishes,
  unsafeLinkWish,
  weekendWardrobe,
  WISHLIST_LIMIT_MESSAGE,
  workWardrobe,
  type WishlistMockOptions,
} from "./wishlistApiMock";

const JAVASCRIPT_HREF = "javascript:alert(1)";
const HTTP_HREF = "http://example.com/bag";

const openHome = async (
  page: Page,
  options?: WishlistMockOptions,
): Promise<void> => {
  await seedFirebaseAuth(page);
  await mockFirebaseAuthNetwork(page);
  await installWishlistApiMocks(page, options);
  await openSignedInHome(page);
};

const wishList = (page: Page) => {
  return page.getByRole("region", { name: "Wish list" });
};

const expectNoPaywall = async (page: Page): Promise<void> => {
  await expect(
    page.getByRole("heading", { name: "Clothing item limit reached" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Upgrade to Basic to add more clothing items",
    }),
  ).toHaveCount(0);
};

test.describe("Wish list row", () => {
  test("shows loading skeleton cards", async ({ page }) => {
    await openHome(page, {
      wishes: populatedWishes,
      holdWishlistList: true,
    });

    await expect(
      page.getByRole("status", { name: "Loading wish list" }),
    ).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Loading wish list" }),
    ).toBeVisible();
  });

  test("shows an empty state with an add button", async ({ page }) => {
    await openHome(page, { wishes: [] });

    await expect(
      wishList(page).getByRole("heading", { name: "No wishes yet" }),
    ).toBeVisible();
    await expect(
      wishList(page).getByRole("button", { name: "Add to wish list" }),
    ).toBeVisible();
    await expectNoPaywall(page);
  });

  test("lets a Free-tier user use the wish list with no paywall", async ({
    page,
  }) => {
    await openHome(page, {
      wishes: [],
      wardrobes: [weekendWardrobe],
    });

    await expect(
      page.getByRole("heading", { level: 2, name: "Wish list" }),
    ).toBeVisible();
    await expectNoPaywall(page);

    await page.getByRole("button", { name: "Add to wish list" }).click();
    await expect(
      page.getByRole("heading", { name: "Add to wish list" }),
    ).toBeVisible();
    await expectNoPaywall(page);
    await page.getByRole("textbox", { name: "Name" }).fill("Wanted coat");
    await page.getByRole("button", { name: "Save wish" }).click();

    await expect(
      page.getByRole("button", { name: "Wanted coat" }),
    ).toBeVisible();
    await expectNoPaywall(page);
  });

  test("adds a wish from the empty state", async ({ page }) => {
    await openHome(page, { wishes: [] });

    await page.getByRole("button", { name: "Add to wish list" }).click();
    await expect(
      page.getByRole("heading", { name: "Add to wish list" }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Name" }).fill("Ivory midi");
    await page.getByRole("button", { name: "Save wish" }).click();

    await expect(
      page.getByRole("button", { name: "Ivory midi" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No wishes yet" }),
    ).toHaveCount(0);
  });

  test("opens wish detail and edits the name", async ({ page }) => {
    await openHome(page, { wishes: [httpsWish] });

    await page.getByRole("button", { name: "Black loafers" }).click();
    const detail = page.getByRole("dialog", { name: "Black loafers" });
    await expect(detail).toBeVisible();
    await expect(
      detail.getByRole("button", { name: "Mark this wish as owned" }),
    ).toBeVisible();

    await detail.getByRole("button", { name: "Edit this wish" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit wish" }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Name" }).fill("Black loafers v2");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(
      page.getByRole("button", { name: "Black loafers v2" }),
    ).toBeVisible();
  });

  test("acquires into the only wardrobe without a picker", async ({ page }) => {
    await openHome(page, {
      wishes: [httpsWish],
      wardrobes: [weekendWardrobe],
    });

    await page.getByRole("button", { name: "Black loafers" }).click();
    await page
      .getByRole("button", { name: "Mark this wish as owned" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Choose a wardrobe" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Black loafers" }),
    ).toHaveCount(0);
  });

  test("shows a wardrobe picker when several wardrobes exist", async ({
    page,
  }) => {
    await openHome(page, {
      wishes: [httpsWish],
      wardrobes: [weekendWardrobe, workWardrobe],
    });

    await page.getByRole("button", { name: "Black loafers" }).click();
    await page
      .getByRole("button", { name: "Mark this wish as owned" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Choose a wardrobe" }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Wardrobe" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("button", { name: "Black loafers" }),
    ).toBeVisible();
  });

  test("keeps the wish and shows the item-cap paywall when acquire is blocked", async ({
    page,
  }) => {
    await openHome(page, {
      wishes: [httpsWish],
      wardrobes: [weekendWardrobe],
      acquireItemCap: true,
    });

    await page.getByRole("button", { name: "Black loafers" }).click();
    await page
      .getByRole("button", { name: "Mark this wish as owned" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Clothing item limit reached" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Upgrade to Basic to add more clothing items",
      }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Close" }).click();
    await expect(
      page.getByRole("button", { name: "Black loafers" }),
    ).toBeVisible();
  });

  test("rejects non-https links in the form", async ({ page }) => {
    await openHome(page, { wishes: [] });

    await page.getByRole("button", { name: "Add to wish list" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill("Blocked link");
    await page.getByRole("textbox", { name: "Link" }).fill("http://example.com");
    await page.getByRole("button", { name: "Save wish" }).click();
    await expect(page.getByText("Enter an https:// link.")).toBeVisible();

    await page
      .getByRole("textbox", { name: "Link" })
      .fill(JAVASCRIPT_HREF);
    await page.getByRole("button", { name: "Save wish" }).click();
    await expect(page.getByText("Enter an https:// link.")).toBeVisible();
  });

  test("does not render javascript or http wish links as clickable hrefs", async ({
    page,
  }) => {
    await openHome(page, {
      wishes: [httpsWish, unsafeLinkWish, httpLinkWish],
    });

    await expect(page.locator(`a[href="${JAVASCRIPT_HREF}"]`)).toHaveCount(0);
    await expect(page.locator(`a[href="${HTTP_HREF}"]`)).toHaveCount(0);

    await page.getByRole("button", { name: "Black loafers" }).click();
    const httpsLink = page.getByRole("link", {
      name: "Open product link in a new tab",
    });
    await expect(httpsLink).toHaveAttribute(
      "href",
      "https://example.com/black-loafers",
    );
    await expect(httpsLink).toHaveAttribute("target", "_blank");
    await expect(httpsLink).toHaveAttribute("rel", "noopener noreferrer");
    await page.getByRole("button", { name: "Close" }).click();

    await page.getByRole("button", { name: "Unsafe link coat" }).click();
    await expect(
      page.getByRole("dialog", { name: "Unsafe link coat" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open product link in a new tab" }),
    ).toHaveCount(0);
    await expect(page.locator(`a[href="${JAVASCRIPT_HREF}"]`)).toHaveCount(0);
    await page.getByRole("button", { name: "Close" }).click();

    await page.getByRole("button", { name: "Http link bag" }).click();
    await expect(
      page.getByRole("dialog", { name: "Http link bag" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open product link in a new tab" }),
    ).toHaveCount(0);
    await expect(page.locator(`a[href="${HTTP_HREF}"]`)).toHaveCount(0);
  });

  test("prompts for a missing category and photo before acquire", async ({
    page,
  }) => {
    await openHome(page, {
      wishes: [incompleteWish],
      wardrobes: [weekendWardrobe],
    });

    await page.getByRole("button", { name: "Linen shirt" }).click();
    await page
      .getByRole("button", { name: "Mark this wish as owned" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Add a few details first" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Mark as owned needs a category and a photo. Save those, then try again.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Choose a wardrobe" }),
    ).toHaveCount(0);

    await page
      .getByRole("button", { name: "Add the missing category or photo" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Edit wish" }),
    ).toBeVisible();
  });

  test("shows the WISHLIST_LIMIT message at 500 wishes", async ({ page }) => {
    await openHome(page, {
      wishes: [],
      rejectCreateAtLimit: true,
    });

    await page.getByRole("button", { name: "Add to wish list" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill("One more");
    await page.getByRole("button", { name: "Save wish" }).click();

    await expect(page.getByText(WISHLIST_LIMIT_MESSAGE)).toBeVisible();
    await expectNoPaywall(page);
  });

  test("loads additional wishes from nextCursor", async ({ page }) => {
    await openHome(page, {
      wishes: [httpsWish, incompleteWish],
      pagedWishlist: true,
    });

    await expect(
      page.getByRole("button", { name: "Black loafers" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Linen shirt" }),
    ).toBeVisible();
  });
});
