import { expect, type Page, type Request } from "@playwright/test";
import { E2E_API_ORIGIN } from "./env";
import { PIXEL_HOST_PATTERN, seedConsent } from "./trackingHelpers";

export const E2E_S3_UPLOAD_URL = "https://s3.test.amazonaws.com/support-upload";
export const E2E_SCREENSHOT_KEY = "support/e2e-screenshot.png";

export const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

export const PRESIGNED_FIELDS = {
  key: E2E_SCREENSHOT_KEY,
  policy: "e2e-policy",
  "x-amz-algorithm": "AWS4-HMAC-SHA256",
  "x-amz-credential": "AKIAEXAMPLE/20260101/us-east-1/s3/aws4_request",
  "x-amz-date": "20260101T000000Z",
  "x-amz-signature": "e2e-signature",
} as const;

export type MultipartPart = {
  name: string;
  filename?: string;
  value: string;
};

export const readMultipartParts = (
  buffer: Buffer,
  contentType: string,
): MultipartPart[] => {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = boundaryMatch?.[1] ?? boundaryMatch?.[2];
  if (!boundary) {
    return [];
  }

  const text = buffer.toString("latin1");
  const rawParts = text.split(`--${boundary}`).slice(1, -1);

  return rawParts.map((part) => {
    const trimmed = part.replace(/^\r\n/, "");
    const separator = "\r\n\r\n";
    const separatorIndex = trimmed.indexOf(separator);
    const head = separatorIndex >= 0 ? trimmed.slice(0, separatorIndex) : trimmed;
    const body =
      separatorIndex >= 0
        ? trimmed.slice(separatorIndex + separator.length).replace(/\r\n$/, "")
        : "";
    const name = head.match(/name="([^"]+)"/)?.[1] ?? "";
    const filename = head.match(/filename="([^"]+)"/)?.[1];
    return { name, filename, value: body };
  });
};

export const readJsonBody = (request: Request): Record<string, unknown> => {
  const raw = request.postData();
  if (!raw) {
    return {};
  }

  return JSON.parse(raw) as Record<string, unknown>;
};

export type ContactApiMock = {
  uploadUrlCalls: Record<string, unknown>[];
  feedbackCalls: Record<string, unknown>[];
  s3Uploads: { names: string[]; parts: MultipartPart[] }[];
};

export type ContactApiMockOptions = {
  feedbackStatus?: number;
  feedbackBody?: unknown;
  feedbackHeaders?: Record<string, string>;
};

export const installContactApiMocks = async (
  page: Page,
  options: ContactApiMockOptions = {},
): Promise<ContactApiMock> => {
  const mock: ContactApiMock = {
    uploadUrlCalls: [],
    feedbackCalls: [],
    s3Uploads: [],
  };

  await page.route(PIXEL_HOST_PATTERN, async (route) => {
    await route.abort();
  });
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

  await page.route(
    (url) =>
      url.origin === E2E_API_ORIGIN && url.pathname === "/support/upload-url",
    async (route) => {
      mock.uploadUrlCalls.push(readJsonBody(route.request()));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: E2E_S3_UPLOAD_URL,
          fields: PRESIGNED_FIELDS,
          screenshotKey: E2E_SCREENSHOT_KEY,
        }),
      });
    },
  );

  await page.route(
    (url) =>
      url.origin === E2E_API_ORIGIN && url.pathname === "/support/feedback",
    async (route) => {
      mock.feedbackCalls.push(readJsonBody(route.request()));
      await route.fulfill({
        status: options.feedbackStatus ?? 201,
        contentType: "application/json",
        headers: options.feedbackHeaders,
        body: JSON.stringify(
          options.feedbackBody ?? { conversationId: "conv_e2e_1" },
        ),
      });
    },
  );

  await page.route(E2E_S3_UPLOAD_URL, async (route) => {
    const request = route.request();
    const contentType = request.headers()["content-type"] ?? "";
    const buffer = request.postDataBuffer();
    const parts = buffer ? readMultipartParts(buffer, contentType) : [];
    mock.s3Uploads.push({
      names: parts.map((part) => part.name),
      parts,
    });
    await route.fulfill({ status: 204, body: "" });
  });

  return mock;
};

export const openContactPage = async (page: Page): Promise<void> => {
  await seedConsent(page, { analytics: false, marketing: false });
  await page.goto("/contact");
  await expect(
    page.getByRole("heading", { level: 1, name: "Contact us" }),
  ).toBeVisible();
  await expect(page.getByRole("form", { name: "Contact form" })).toBeVisible();
};

export const fillContactForm = async (
  page: Page,
  {
    email = "ada@example.com",
    message = "How do I catalog coats?",
    type = "query",
  }: {
    email?: string;
    message?: string;
    type?: "bug" | "query";
  } = {},
): Promise<void> => {
  if (type === "bug") {
    await page.getByRole("button", { name: "Bug report" }).click();
  }

  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Message" }).fill(message);
};
