import { expect, test, type Page } from "@playwright/test";
import { openAdminSupport } from "./adminAuth";
import { installAdminSupportApiMocks } from "./adminSupportApiMock";
import { seedTrackingIds, installTrackingStubs } from "./trackingHelpers";

const openInbox = async (
  page: Page,
  options?: Parameters<typeof installAdminSupportApiMocks>[1],
  session?: Parameters<typeof openAdminSupport>[1],
) => {
  await openAdminSupport(page, session);
  const mocks = await installAdminSupportApiMocks(page, options);
  await page.goto("/admin/support");
  return mocks;
};

test.describe("Admin support inbox", () => {
  test("shows sign-in when signed out", async ({ page }) => {
    await openInbox(page, {}, { admin: false, signedOut: true });
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign in with email" }),
    ).toBeVisible();
    await expect(
      page.locator('meta[name="robots"]'),
    ).toHaveAttribute("content", "noindex,nofollow");
  });

  test("shows not authorised for a signed-in non-admin", async ({ page }) => {
    await openInbox(page, {}, { admin: false });
    await expect(
      page.getByRole("heading", { name: "Not authorised" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  test("lists conversations, switches filters, and loads more", async ({
    page,
  }) => {
    await openInbox(page);
    await expect(
      page.getByRole("heading", { name: "Support inbox" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Bug from user@example.com" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Load more" }).click();
    await expect(
      page.getByRole("button", { name: "Question from second@example.com" }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Replied" }).click();
    await expect(
      page.getByRole("button", { name: "Bug from user@example.com" }),
    ).toBeVisible();
  });

  test("renders a list row when lastMessagePreview is empty", async ({
    page,
  }) => {
    await openInbox(page, {
      listStatus: {
        open: {
          items: [
            {
              conversationId: "conv_1",
              status: "open",
              type: "bug",
              email: "user@example.com",
              platform: "ios",
              uid: "user-1",
              createdAt: "2026-11-24T10:00:00.000Z",
              lastMessageAt: "2026-11-24T11:00:00.000Z",
              lastMessagePreview: "The upload failed",
              lastMessageAuthor: "user",
              lastEmailStatus: null,
            },
            {
              conversationId: "conv_legacy",
              status: "open",
              type: "bug",
              email: "legacy@example.com",
              platform: "ios",
              uid: null,
              createdAt: "2026-10-01T10:00:00.000Z",
              lastMessageAt: "2026-10-01T10:00:00.000Z",
              lastMessagePreview: "",
              lastMessageAuthor: "user",
              lastEmailStatus: "",
            },
          ],
          nextCursor: null,
        },
        replied: { items: [], nextCursor: null },
        closed: { items: [], nextCursor: null },
      },
    });

    await expect(
      page.getByRole("button", { name: "Bug from user@example.com" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Bug from legacy@example.com" }),
    ).toBeVisible();
    await expect(page.getByText("No preview")).toBeVisible();
  });

  test("opens a thread, replies with a failed email, retries, and closes", async ({
    page,
  }) => {
    await openInbox(page, { replyEmailStatus: "failed" });
    await page.getByRole("button", { name: "Bug from user@example.com" }).click();
    await expect(page.getByText("The upload failed")).toBeVisible();
    await expect(page.getByText("iPhone")).toBeVisible();
    await expect(page.getByRole("img", { name: "Conversation screenshot" })).toBeVisible();

    await page.getByRole("textbox", { name: "Reply" }).fill(
      "Thanks, we are looking into this.",
    );
    await page.getByRole("button", { name: "Send reply" }).click();
    await expect(page.getByLabel("Email failed")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry email" })).toBeVisible();

    await page.getByRole("button", { name: "Retry email" }).click();
    await expect(page.getByLabel("Email sent")).toBeVisible();

    await page.getByRole("button", { name: "Close this conversation" }).click();
    await page.getByRole("button", { name: "Close conversation" }).click();
    await expect(page.getByRole("button", { name: "Send reply" })).toHaveCount(0);
  });

  test("shows Pending and hides retry when a message emailStatus is sending", async ({
    page,
  }) => {
    await openInbox(page, {
      threadById: {
        conv_1: {
          conversation: {
            conversationId: "conv_1",
            status: "open",
            type: "bug",
            email: "user@example.com",
            platform: "ios",
            uid: "user-1",
            appVersion: "1.2.3",
            device: "iPhone",
            createdAt: "2026-11-24T10:00:00.000Z",
            lastMessageAt: "2026-11-24T11:10:00.000Z",
          },
          messages: [
            {
              messageId: "msg_user",
              author: "user",
              body: "The upload failed",
              createdAt: "2026-11-24T11:00:00.000Z",
              screenshotUrl: "https://cdn.pocketcloset.test/shot-v1.png",
              emailStatus: null,
            },
            {
              messageId: "msg_admin",
              author: "admin",
              body: "Thanks, we are looking into this.",
              createdAt: "2026-11-24T11:10:00.000Z",
              screenshotUrl: null,
              emailStatus: "sending",
            },
          ],
        },
      },
    });

    await page.getByRole("button", { name: "Bug from user@example.com" }).click();
    await expect(page.getByText("Thanks, we are looking into this.")).toBeVisible();
    await expect(page.getByLabel("Pending")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry email" })).toHaveCount(0);
  });

  test("treats API 401 as signed out and 403 as not authorised", async ({
    page,
  }) => {
    await openInbox(page, { unauthorized: true });
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

    const forbiddenPage = await page.context().newPage();
    await openAdminSupport(forbiddenPage, { admin: true });
    await installAdminSupportApiMocks(forbiddenPage, { forbidden: true });
    await forbiddenPage.goto("/admin/support");
    await expect(
      forbiddenPage.getByRole("heading", { name: "Not authorised" }),
    ).toBeVisible();
    await forbiddenPage.close();
  });

  test("refetches thread detail before opening a screenshot after 900s", async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-01-01T00:00:00.000Z") });
    await page.clock.resume();
    const mocks = await openInbox(page);
    await page.getByRole("button", { name: "Bug from user@example.com" }).click();
    await expect(page.getByRole("img", { name: "Conversation screenshot" })).toBeVisible();
    const getsAfterOpen = mocks.threadGets();
    expect(getsAfterOpen).toBeGreaterThanOrEqual(1);

    await page.getByRole("button", { name: "Open screenshot" }).click();
    await expect(page.getByRole("dialog", { name: "Screenshot" })).toBeVisible();
    expect(mocks.threadGets()).toBe(getsAfterOpen);
    await page.getByRole("button", { name: "Close screenshot" }).click();

    await page.clock.fastForward(900_000);
    await page.getByRole("button", { name: "Open screenshot" }).click();
    await expect(page.getByRole("dialog", { name: "Screenshot" })).toBeVisible();
    expect(mocks.threadGets()).toBeGreaterThan(getsAfterOpen);
    await expect(
      page.getByRole("dialog", { name: "Screenshot" }).getByAltText("Conversation screenshot"),
    ).toHaveAttribute("src", /shot-v2/);
  });

  test("does not send analytics events on the operator inbox", async ({
    page,
  }) => {
    await seedTrackingIds(page);
    await installTrackingStubs(page);
    await openAdminSupport(
      page,
      { admin: true },
      { analytics: true, marketing: true },
    );
    await installAdminSupportApiMocks(page);
    await page.goto("/admin/support");
    await expect(
      page.getByRole("heading", { name: "Support inbox" }),
    ).toBeVisible();

    const calls = await page.evaluate(() => window.__WARDROBE_TRACKING_CALLS__);
    expect(calls?.gtag ?? []).toEqual([]);
    expect(calls?.fbq ?? []).toEqual([]);
    expect(calls?.ttq ?? []).toEqual([]);
  });
});
