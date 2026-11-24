import { expect, test } from "@playwright/test";
import {
  E2E_SCREENSHOT_KEY,
  PNG_1X1,
  PRESIGNED_FIELDS,
  fillContactForm,
  installContactApiMocks,
  openContactPage,
} from "./contactHelpers";

test.describe("contact form", () => {
  test("submits a question without a screenshot", async ({ page }) => {
    const mock = await installContactApiMocks(page);
    await openContactPage(page);
    await fillContactForm(page);

    await page.getByRole("button", { name: "Send contact message" }).click();

    await expect(
      page.getByText(
        "Thanks for contacting Pocket Closet. We received your message and will reply if a response is needed.",
      ),
    ).toBeVisible();
    expect(mock.uploadUrlCalls).toHaveLength(0);
    expect(mock.s3Uploads).toHaveLength(0);
    expect(mock.feedbackCalls).toHaveLength(1);
    expect(mock.feedbackCalls[0]).toMatchObject({
      type: "query",
      email: "ada@example.com",
      message: "How do I catalog coats?",
      platform: "web",
      website: "",
    });
    expect(mock.feedbackCalls[0]?.screenshotKey).toBeUndefined();
  });

  test("uploads a screenshot then posts feedback with fields then file", async ({
    page,
  }) => {
    const mock = await installContactApiMocks(page);
    await openContactPage(page);
    await fillContactForm(page, { type: "bug" });
    await page.locator('input[name="screenshot"]').setInputFiles({
      name: "bug.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });

    await expect(
      page.getByRole("img", { name: "Preview of bug.png" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Send contact message" }).click();

    await expect(
      page.getByText(
        "Thanks for contacting Pocket Closet. We received your message and will reply if a response is needed.",
      ),
    ).toBeVisible();

    expect(mock.uploadUrlCalls).toEqual([{ contentType: "image/png" }]);
    expect(mock.s3Uploads).toHaveLength(1);
    const uploaded = mock.s3Uploads[0];
    expect(uploaded?.names.at(-1)).toBe("file");
    expect(uploaded?.names.slice(0, -1)).toEqual(Object.keys(PRESIGNED_FIELDS));
    expect(uploaded?.parts.find((part) => part.name === "file")?.filename).toBe(
      "bug.png",
    );
    expect(mock.feedbackCalls[0]).toMatchObject({
      type: "bug",
      screenshotKey: E2E_SCREENSHOT_KEY,
      website: "",
      platform: "web",
    });
  });

  test("maps 400 field errors onto the form", async ({ page }) => {
    const mock = await installContactApiMocks(page, {
      feedbackStatus: 400,
      feedbackBody: {
        error: "validation",
        fields: {
          email: "Enter a valid email address.",
          message: "Message is too short.",
        },
      },
    });
    await openContactPage(page);
    await fillContactForm(page);

    await page.getByRole("button", { name: "Send contact message" }).click();

    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText(/Message is too short/)).toBeVisible();
    await expect(
      page.getByText(
        "Your message is too long or a field is invalid, please check and try again.",
      ),
    ).toBeVisible();
    expect(mock.feedbackCalls).toHaveLength(1);
    await expect(
      page.getByRole("button", { name: "Send contact message" }),
    ).toBeEnabled();
  });

  test("shows a friendly 429 retry message", async ({ page }) => {
    await installContactApiMocks(page, {
      feedbackStatus: 429,
      feedbackBody: { error: "rate_limited", retryAfterSeconds: 120 },
      feedbackHeaders: { "Retry-After": "120" },
    });
    await openContactPage(page);
    await fillContactForm(page);

    await page.getByRole("button", { name: "Send contact message" }).click();

    await expect(
      page.getByText("Too many requests. Please try again in 2 minutes."),
    ).toBeVisible();
  });

  test("rejects an oversize screenshot on the client", async ({ page }) => {
    const mock = await installContactApiMocks(page);
    await openContactPage(page);
    await fillContactForm(page);

    await page.locator('input[name="screenshot"]').setInputFiles({
      name: "huge.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    });

    await expect(
      page.getByText("Screenshots must be 5 MB or smaller."),
    ).toBeVisible();
    expect(mock.uploadUrlCalls).toHaveLength(0);
    expect(mock.s3Uploads).toHaveLength(0);
    expect(mock.feedbackCalls).toHaveLength(0);
  });

  test("rejects a non PNG or JPEG screenshot on the client", async ({
    page,
  }) => {
    const mock = await installContactApiMocks(page);
    await openContactPage(page);

    await page.locator('input[name="screenshot"]').setInputFiles({
      name: "notes.gif",
      mimeType: "image/gif",
      buffer: Buffer.from("GIF89a"),
    });

    await expect(
      page.getByText("Please choose a PNG or JPEG image."),
    ).toBeVisible();
    expect(mock.uploadUrlCalls).toHaveLength(0);
    expect(mock.feedbackCalls).toHaveLength(0);
  });

  test("sends the website honeypot empty", async ({ page }) => {
    const mock = await installContactApiMocks(page);
    await openContactPage(page);

    const honeypot = page.locator('input[name="website"]');
    await expect(honeypot).toHaveAttribute("aria-hidden", "true");
    await expect(honeypot).toHaveAttribute("tabindex", "-1");
    await expect(honeypot).toHaveValue("");

    await fillContactForm(page);
    await page.getByRole("button", { name: "Send contact message" }).click();

    await expect(
      page.getByText(
        "Thanks for contacting Pocket Closet. We received your message and will reply if a response is needed.",
      ),
    ).toBeVisible();
    expect(mock.feedbackCalls[0]?.website).toBe("");
  });
});
