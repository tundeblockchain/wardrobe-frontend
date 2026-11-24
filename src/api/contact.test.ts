import { describe, expect, it, vi } from "vitest";
import {
  buildDeviceLabel,
  buildFeedbackRequestBody,
  buildPresignedPostFormData,
  CONTACT_EMAIL_MAX,
  CONTACT_MESSAGE_MAX,
  CONTACT_STATUS_MESSAGES,
  formatRateLimitedMessage,
  getSupportFeedbackUrl,
  getSupportUploadUrl,
  listFormDataKeys,
  mapValidationFieldErrors,
  parseUploadUrlResponse,
  postFileToPresignedPost,
  requestSupportUploadUrl,
  SCREENSHOT_MAX_BYTES,
  sendSupportFeedback,
  submitSupportFeedback,
  validateContactFormValues,
  validateScreenshotFile,
} from "./contact";

const validFields = {
  type: "query" as const,
  email: "  ada@example.com  ",
  message: "  How do I catalog coats?  ",
  website: "",
};

const expectedFeedbackBody = {
  type: "query" as const,
  email: "ada@example.com",
  message: "How do I catalog coats?",
  platform: "web" as const,
  website: "",
};

const createJsonResponse = ({
  status,
  body,
  headers,
}: {
  status: number;
  body?: unknown;
  headers?: Headers;
}) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: headers ?? new Headers(),
    json: async () => body,
  };
};

const pngFile = (size = 8, name = "shot.png") => {
  return new File([new Uint8Array(size)], name, { type: "image/png" });
};

describe("contact helpers", () => {
  it("builds the support upload-url and feedback URLs from the API base", () => {
    expect(getSupportUploadUrl("https://api.example.com")).toBe(
      "https://api.example.com/support/upload-url",
    );
    expect(getSupportFeedbackUrl("https://api.example.com/")).toBe(
      "https://api.example.com/support/feedback",
    );
  });

  it("builds a short device label from a browser user agent", () => {
    expect(
      buildDeviceLabel(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      ),
    ).toBe("Chrome 131 / macOS");
    expect(
      buildDeviceLabel(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
      ),
    ).toBe("Firefox 133 / Windows");
    expect(buildDeviceLabel("")).toBe("web");
    expect(buildDeviceLabel("x".repeat(200)).length).toBe(120);
  });

  it("includes the honeypot value as entered, including empty", () => {
    expect(buildFeedbackRequestBody({ fields: validFields }).website).toBe("");
    expect(
      buildFeedbackRequestBody({
        fields: { ...validFields, website: "https://spam.example" },
      }).website,
    ).toBe("https://spam.example");
  });

  it("omits screenshotKey and appVersion unless provided", () => {
    expect(buildFeedbackRequestBody({ fields: validFields })).toEqual(
      expectedFeedbackBody,
    );
    expect(
      buildFeedbackRequestBody({
        fields: validFields,
        screenshotKey: "support/abc.png",
        device: "Chrome 131 / macOS",
        appVersion: "1.2.3",
      }),
    ).toEqual({
      ...expectedFeedbackBody,
      screenshotKey: "support/abc.png",
      device: "Chrome 131 / macOS",
      appVersion: "1.2.3",
    });
  });

  it("validates type, email, and message", () => {
    expect(
      validateContactFormValues({
        type: "query",
        email: "",
        message: "   ",
        website: "",
      }),
    ).toEqual({
      email: "Enter your email address.",
      message: "Enter a message.",
    });
    expect(
      validateContactFormValues({
        type: "query",
        email: `${"a".repeat(CONTACT_EMAIL_MAX - 11)}@example.com`,
        message: "M".repeat(CONTACT_MESSAGE_MAX + 1),
        website: "",
      }),
    ).toEqual({
      email: `Email must be ${CONTACT_EMAIL_MAX} characters or fewer.`,
      message: `Message must be ${CONTACT_MESSAGE_MAX} characters or fewer.`,
    });
    expect(
      validateContactFormValues({
        type: "bug",
        email: "not-an-email",
        message: "Hello",
        website: "ignored",
      }).email,
    ).toBe("Enter a valid email address.");
    expect(
      validateContactFormValues({
        type: "bug",
        email: "ada@example.com",
        message: "Hello",
        website: "ignored",
      }),
    ).toEqual({});
  });

  it("rejects screenshots that are the wrong type or larger than 5 MB", () => {
    expect(
      validateScreenshotFile(
        new File(["gif"], "anim.gif", { type: "image/gif" }),
      ),
    ).toBe(CONTACT_STATUS_MESSAGES.screenshotType);
    expect(
      validateScreenshotFile(
        new File([new Uint8Array(SCREENSHOT_MAX_BYTES + 1)], "big.png", {
          type: "image/png",
        }),
      ),
    ).toBe(CONTACT_STATUS_MESSAGES.screenshotSize);
    expect(validateScreenshotFile(pngFile())).toBeUndefined();
    expect(
      validateScreenshotFile(
        new File(["jpeg"], "photo.jpg", { type: "image/jpeg" }),
      ),
    ).toBeUndefined();
  });

  it("maps backend 400 fields onto form field errors", () => {
    expect(
      mapValidationFieldErrors({
        email: "Enter a valid email address.",
        message: "Message is too short.",
      }),
    ).toEqual({
      email: "Enter a valid email address.",
      message: "Message is too short.",
    });
    expect(
      mapValidationFieldErrors({
        screenshotKey: "Screenshot is missing.",
        contentType: "Must be png or jpeg.",
      }),
    ).toEqual({
      screenshot: "Must be png or jpeg.",
    });
    expect(mapValidationFieldErrors({ website: "leave empty" })).toEqual({});
    expect(mapValidationFieldErrors(undefined)).toEqual({});
  });

  it("formats rate-limit copy from retry seconds", () => {
    expect(formatRateLimitedMessage()).toBe(CONTACT_STATUS_MESSAGES.rateLimited);
    expect(formatRateLimitedMessage(30)).toBe(
      "Too many requests. Please try again in 1 minute.",
    );
    expect(formatRateLimitedMessage(120)).toBe(
      "Too many requests. Please try again in 2 minutes.",
    );
  });

  it("appends presigned POST fields first and the file last", () => {
    const file = pngFile();
    const fields = {
      key: "support/abc.png",
      policy: "policy-token",
      "x-amz-algorithm": "AWS4-HMAC-SHA256",
      "x-amz-credential": "AKIA/20260101/us-east-1/s3/aws4_request",
    };
    const formData = buildPresignedPostFormData(fields, file, "shot.png");
    expect(listFormDataKeys(formData)).toEqual([
      "key",
      "policy",
      "x-amz-algorithm",
      "x-amz-credential",
      "file",
    ]);
    const uploaded = formData.get("file");
    expect(uploaded).toBeInstanceOf(File);
    expect((uploaded as File).name).toBe("shot.png");
    expect((uploaded as File).type).toBe("image/png");
    expect(formData.get("key")).toBe("support/abc.png");
  });
});

describe("requestSupportUploadUrl", () => {
  it("POSTs JSON without Authorization or credentials", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 200,
        body: {
          url: "https://s3.example.com/upload",
          fields: { key: "support/abc.png", policy: "p" },
          screenshotKey: "support/abc.png",
        },
      }),
    );

    await expect(
      requestSupportUploadUrl({
        apiBaseUrl: "https://api.example.com",
        contentType: "image/png",
        fetchImpl,
      }),
    ).resolves.toEqual({
      url: "https://s3.example.com/upload",
      fields: { key: "support/abc.png", policy: "p" },
      screenshotKey: "support/abc.png",
    });

    const [url, options] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/support/upload-url");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("omit");
    expect(options.headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
    expect(JSON.stringify(options.headers).toLowerCase()).not.toContain(
      "authorization",
    );
    expect(JSON.parse(String(options.body))).toEqual({
      contentType: "image/png",
    });
  });

  it("rejects an upload-url payload missing url, fields, or screenshotKey", () => {
    expect(() => parseUploadUrlResponse({ fields: {}, screenshotKey: "k" })).toThrow();
    expect(() =>
      parseUploadUrlResponse({ url: "https://s3.example.com", screenshotKey: "k" }),
    ).toThrow();
    expect(() =>
      parseUploadUrlResponse({
        url: "https://s3.example.com",
        fields: { key: "k" },
      }),
    ).toThrow();
  });
});

describe("postFileToPresignedPost", () => {
  it("POSTs multipart with credentials omit and no JSON content type", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });
    const file = pngFile();
    const fields = { key: "support/abc.png", policy: "p" };

    await postFileToPresignedPost({
      url: "https://s3.example.com/upload",
      fields,
      file,
      fileName: "shot.png",
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, options] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://s3.example.com/upload");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("omit");
    expect(options.headers).toBeUndefined();
    expect(options.body).toBeInstanceOf(FormData);
    const formData = options.body as FormData;
    expect(listFormDataKeys(formData)).toEqual(["key", "policy", "file"]);
    const uploaded = formData.get("file");
    expect(uploaded).toBeInstanceOf(File);
    expect((uploaded as File).name).toBe("shot.png");
  });
});

describe("sendSupportFeedback", () => {
  it("POSTs JSON without Authorization or credentials", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 201,
        body: { conversationId: "  conv_123  " },
      }),
    );

    await expect(
      sendSupportFeedback({
        apiBaseUrl: "https://api.example.com",
        body: expectedFeedbackBody,
        fetchImpl,
      }),
    ).resolves.toEqual({ conversationId: "conv_123" });

    const [url, options] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/support/feedback");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("omit");
    expect(options.headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
    expect(JSON.stringify(options.headers).toLowerCase()).not.toContain(
      "authorization",
    );
    expect(JSON.parse(String(options.body))).toEqual(expectedFeedbackBody);
  });
});

describe("submitSupportFeedback", () => {
  it("returns misconfigured when the API base is missing", async () => {
    const fetchImpl = vi.fn();

    await expect(
      submitSupportFeedback({
        apiBaseUrl: undefined,
        fields: validFields,
        fetchImpl,
      }),
    ).resolves.toEqual({ status: "misconfigured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("POSTs feedback only when there is no screenshot", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 201,
        body: { conversationId: "conv_1" },
      }),
    );

    await expect(
      submitSupportFeedback({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl,
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
      }),
    ).resolves.toEqual({ status: "success", conversationId: "conv_1" });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, options] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/support/feedback");
    expect(JSON.parse(String(options.body))).toEqual({
      ...expectedFeedbackBody,
      device: "Chrome 131 / macOS",
    });
  });

  it("uploads a screenshot then POSTs feedback with screenshotKey", async () => {
    const file = pngFile();
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).endsWith("/support/upload-url")) {
        return createJsonResponse({
          status: 200,
          body: {
            url: "https://s3.example.com/upload",
            fields: { key: "support/abc.png", policy: "p" },
            screenshotKey: "support/abc.png",
          },
        });
      }

      if (String(url) === "https://s3.example.com/upload") {
        return { ok: true, status: 204 };
      }

      return createJsonResponse({
        status: 201,
        body: { conversationId: "conv_2" },
      });
    });

    await expect(
      submitSupportFeedback({
        apiBaseUrl: "https://api.example.com",
        fields: { ...validFields, type: "bug" },
        screenshotFile: file,
        fetchImpl: fetchImpl as unknown as typeof fetch,
        userAgent: "Mozilla/5.0 Chrome/131.0.0.0 Safari/537.36",
      }),
    ).resolves.toEqual({ status: "success", conversationId: "conv_2" });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const uploadUrlCall = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(uploadUrlCall[0]).toBe("https://api.example.com/support/upload-url");
    expect(JSON.parse(String(uploadUrlCall[1].body))).toEqual({
      contentType: "image/png",
    });

    const s3Call = fetchImpl.mock.calls[1] as unknown as [string, RequestInit];
    expect(s3Call[0]).toBe("https://s3.example.com/upload");
    const formData = s3Call[1].body as FormData;
    expect(listFormDataKeys(formData)).toEqual(["key", "policy", "file"]);
    const uploaded = formData.get("file");
    expect(uploaded).toBeInstanceOf(File);
    expect((uploaded as File).name).toBe("shot.png");

    const feedbackCall = fetchImpl.mock.calls[2] as unknown as [
      string,
      RequestInit,
    ];
    expect(feedbackCall[0]).toBe("https://api.example.com/support/feedback");
    expect(JSON.parse(String(feedbackCall[1].body))).toMatchObject({
      type: "bug",
      screenshotKey: "support/abc.png",
      website: "",
      platform: "web",
    });
  });

  it("rejects an oversize screenshot before calling the API", async () => {
    const fetchImpl = vi.fn();

    await expect(
      submitSupportFeedback({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        screenshotFile: new File(
          [new Uint8Array(SCREENSHOT_MAX_BYTES + 1)],
          "big.png",
          { type: "image/png" },
        ),
        fetchImpl,
      }),
    ).resolves.toEqual({
      status: "validation",
      message: CONTACT_STATUS_MESSAGES.validation,
      fieldErrors: { screenshot: CONTACT_STATUS_MESSAGES.screenshotSize },
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("maps 400 validation fields onto form errors", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 400,
        body: {
          error: "validation",
          fields: { email: "Enter a valid email address." },
        },
      }),
    );

    await expect(
      submitSupportFeedback({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl,
      }),
    ).resolves.toEqual({
      status: "validation",
      message: CONTACT_STATUS_MESSAGES.validation,
      fieldErrors: { email: "Enter a valid email address." },
    });
  });

  it("maps 429 rate_limited and Retry-After seconds", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 429,
        body: { error: "rate_limited", retryAfterSeconds: 180 },
        headers: new Headers({ "Retry-After": "180" }),
      }),
    );

    await expect(
      submitSupportFeedback({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl,
      }),
    ).resolves.toEqual({
      status: "rateLimited",
      retryAfterSeconds: 180,
    });
  });

  it("maps 429 without Retry-After using the body retryAfterSeconds", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 429,
        body: { error: "rate_limited", retryAfterSeconds: 90 },
      }),
    );

    await expect(
      submitSupportFeedback({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl,
      }),
    ).resolves.toEqual({
      status: "rateLimited",
      retryAfterSeconds: 90,
    });
  });

  it("maps 5xx and network failures to a generic retry error", async () => {
    const serverError = vi.fn().mockResolvedValue(
      createJsonResponse({ status: 500 }),
    );
    const thrownFetch = vi.fn().mockRejectedValue(new Error("offline"));

    await expect(
      submitSupportFeedback({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl: serverError,
      }),
    ).resolves.toEqual({
      status: "error",
      message: CONTACT_STATUS_MESSAGES.generic,
    });
    await expect(
      submitSupportFeedback({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl: thrownFetch,
      }),
    ).resolves.toEqual({
      status: "error",
      message: CONTACT_STATUS_MESSAGES.generic,
    });
  });
});
