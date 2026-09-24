import { describe, expect, it, vi } from "vitest";
import {
  buildContactRequestBody,
  CONTACT_EMAIL_MAX,
  CONTACT_MESSAGE_MAX,
  CONTACT_NAME_MAX,
  CONTACT_STATUS_MESSAGES,
  CONTACT_SUBJECT_MAX,
  formatRateLimitedMessage,
  getSupportContactUrl,
  mapValidationFieldErrors,
  sendContactMessage,
  validateContactFormValues,
} from "./contact";

const validFields = {
  name: "  Ada Lovelace  ",
  email: "  ada@example.com  ",
  subject: "  Store listing  ",
  message: "  How do I catalog coats?  ",
  company: "",
};

const expectedBody = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "Store listing",
  message: "How do I catalog coats?",
  company: "",
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

describe("contact helpers", () => {
  it("builds the support contact URL from the API base", () => {
    expect(getSupportContactUrl("https://api.example.com")).toBe(
      "https://api.example.com/support/contact",
    );
  });

  it("trims fields and omits an empty subject", () => {
    expect(buildContactRequestBody(validFields)).toEqual(expectedBody);
    expect(
      buildContactRequestBody({
        ...validFields,
        subject: "   ",
      }),
    ).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "How do I catalog coats?",
      company: "",
    });
  });

  it("sends the honeypot value as entered", () => {
    expect(
      buildContactRequestBody({
        ...validFields,
        company: "Acme Bot",
      }).company,
    ).toBe("Acme Bot");
  });

  it("validates required lengths and a basic email shape", () => {
    expect(
      validateContactFormValues({
        name: " ",
        email: "",
        subject: "",
        message: "   ",
        company: "",
      }),
    ).toEqual({
      name: "Enter your name.",
      email: "Enter your email address.",
      message: "Enter a message.",
    });
    expect(
      validateContactFormValues({
        name: "A".repeat(CONTACT_NAME_MAX + 1),
        email: `${"a".repeat(CONTACT_EMAIL_MAX - 11)}@example.com`,
        subject: "S".repeat(CONTACT_SUBJECT_MAX + 1),
        message: "M".repeat(CONTACT_MESSAGE_MAX + 1),
        company: "",
      }),
    ).toEqual({
      name: `Name must be ${CONTACT_NAME_MAX} characters or fewer.`,
      email: `Email must be ${CONTACT_EMAIL_MAX} characters or fewer.`,
      subject: `Subject must be ${CONTACT_SUBJECT_MAX} characters or fewer.`,
      message: `Message must be ${CONTACT_MESSAGE_MAX} characters or fewer.`,
    });
    expect(
      validateContactFormValues({
        name: "Ada",
        email: "not-an-email",
        subject: "",
        message: "Hello",
        company: "",
      }).email,
    ).toBe("Enter a valid email address.");
    expect(
      validateContactFormValues({
        name: "Ada",
        email: "ada@example.com",
        subject: "",
        message: "Hello",
        company: "ignored",
      }),
    ).toEqual({});
  });

  it("maps backend validation messages onto field errors when they help", () => {
    expect(mapValidationFieldErrors("email is invalid")).toEqual({
      email: "Please check this field.",
    });
    expect(mapValidationFieldErrors("name and message are required")).toEqual({
      name: "Please check this field.",
      message: "Please check this field.",
    });
    expect(mapValidationFieldErrors("Request was not accepted")).toEqual({});
  });

  it("formats rate-limit copy from Retry-After seconds", () => {
    expect(formatRateLimitedMessage()).toBe(CONTACT_STATUS_MESSAGES.rateLimited);
    expect(formatRateLimitedMessage(30)).toBe(
      "You've sent too many messages. Please try again in about 1 minute.",
    );
    expect(formatRateLimitedMessage(120)).toBe(
      "You've sent too many messages. Please try again in about 2 minutes.",
    );
  });
});

describe("sendContactMessage", () => {
  it("returns misconfigured when the API base is missing", async () => {
    const fetchImpl = vi.fn();

    await expect(
      sendContactMessage({
        apiBaseUrl: undefined,
        fields: validFields,
        fetchImpl,
      }),
    ).resolves.toEqual({ status: "misconfigured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("POSTs JSON without Authorization or credentials", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 202,
        body: { status: "sent", kind: "contact", source: "website" },
      }),
    );

    const result = await sendContactMessage({
      apiBaseUrl: "https://api.example.com",
      fields: validFields,
      fetchImpl,
    });
    expect(result).toEqual({ status: "success" });
    expect(result).not.toHaveProperty("id");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, options] = fetchImpl.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.example.com/support/contact");
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("omit");
    expect(options.headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
    expect(options.headers).not.toHaveProperty("Authorization");
    expect(JSON.stringify(options.headers).toLowerCase()).not.toContain(
      "authorization",
    );
    expect(JSON.parse(String(options.body))).toEqual(expectedBody);
  });

  it("accepts an optional id on a 202 success body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 202,
        body: {
          status: "sent",
          kind: "contact",
          source: "website",
          id: "  msg_abc123  ",
        },
      }),
    );

    await expect(
      sendContactMessage({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl,
      }),
    ).resolves.toEqual({ status: "success", id: "msg_abc123" });
  });

  it("ignores a missing or non-string 202 id", async () => {
    const blankIdFetch = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 202,
        body: { status: "sent", kind: "contact", source: "website", id: "  " },
      }),
    );
    const numericIdFetch = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 202,
        body: { status: "sent", kind: "contact", source: "website", id: 99 },
      }),
    );

    await expect(
      sendContactMessage({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl: blankIdFetch,
      }),
    ).resolves.toEqual({ status: "success" });
    await expect(
      sendContactMessage({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl: numericIdFetch,
      }),
    ).resolves.toEqual({ status: "success" });
  });

  it("omits subject from the body when it is blank", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 202,
        body: { status: "sent", kind: "contact", source: "website" },
      }),
    );

    await sendContactMessage({
      apiBaseUrl: "https://api.example.com",
      fields: { ...validFields, subject: "  " },
      fetchImpl,
    });

    const [, options] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(options.body))).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "How do I catalog coats?",
      company: "",
    });
  });

  it("maps 400 VALIDATION_ERROR to a validation result", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 400,
        body: {
          error: {
            code: "VALIDATION_ERROR",
            message: "email is required",
          },
        },
      }),
    );

    await expect(
      sendContactMessage({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl,
      }),
    ).resolves.toEqual({
      status: "validation",
      message: CONTACT_STATUS_MESSAGES.validation,
      fieldErrors: { email: "Please check this field." },
    });
  });

  it("maps 413 VALIDATION_ERROR to the same validation result", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 413,
        body: {
          error: {
            code: "VALIDATION_ERROR",
            message: "Request body is too large",
          },
        },
      }),
    );

    await expect(
      sendContactMessage({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl,
      }),
    ).resolves.toEqual({
      status: "validation",
      message: CONTACT_STATUS_MESSAGES.validation,
      fieldErrors: {},
    });
  });

  it("uses validation copy when a 400 VALIDATION_ERROR message has no field names", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 400,
        body: {
          error: {
            code: "VALIDATION_ERROR",
            message: "Request was not accepted",
          },
        },
      }),
    );

    await expect(
      sendContactMessage({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl,
      }),
    ).resolves.toEqual({
      status: "validation",
      message: CONTACT_STATUS_MESSAGES.validation,
      fieldErrors: {},
    });
  });

  it("maps 403 ORIGIN_NOT_ALLOWED to a generic send error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 403,
        body: {
          error: {
            code: "ORIGIN_NOT_ALLOWED",
            message: "Origin is not allowed",
          },
        },
      }),
    );

    await expect(
      sendContactMessage({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl,
      }),
    ).resolves.toEqual({
      status: "error",
      message: CONTACT_STATUS_MESSAGES.originNotAllowed,
    });
  });

  it("does not treat a 403 as validation even if the body mentions VALIDATION_ERROR", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 403,
        body: {
          error: {
            code: "VALIDATION_ERROR",
            message: "should not be used",
          },
        },
      }),
    );

    await expect(
      sendContactMessage({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl,
      }),
    ).resolves.toEqual({
      status: "error",
      message: CONTACT_STATUS_MESSAGES.originNotAllowed,
    });
  });

  it("maps 429 RATE_LIMITED and reads Retry-After seconds", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 429,
        body: {
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests",
          },
        },
        headers: new Headers({ "Retry-After": "180" }),
      }),
    );

    await expect(
      sendContactMessage({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl,
      }),
    ).resolves.toEqual({
      status: "rateLimited",
      retryAfterSeconds: 180,
    });
  });

  it("maps 429 without Retry-After to rateLimited without minutes", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        status: 429,
        body: {
          error: { code: "RATE_LIMITED", message: "Too many requests" },
        },
      }),
    );

    await expect(
      sendContactMessage({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl,
      }),
    ).resolves.toEqual({
      status: "rateLimited",
    });
  });

  it("maps a 413 without VALIDATION_ERROR, 5xx, and network failures to a generic error", async () => {
    const payloadTooLarge = vi.fn().mockResolvedValue(
      createJsonResponse({ status: 413 }),
    );
    const serverError = vi.fn().mockResolvedValue(
      createJsonResponse({ status: 500 }),
    );
    const thrownFetch = vi.fn().mockRejectedValue(new Error("offline"));

    await expect(
      sendContactMessage({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl: payloadTooLarge,
      }),
    ).resolves.toEqual({
      status: "error",
      message: CONTACT_STATUS_MESSAGES.generic,
    });
    await expect(
      sendContactMessage({
        apiBaseUrl: "https://api.example.com",
        fields: validFields,
        fetchImpl: serverError,
      }),
    ).resolves.toEqual({
      status: "error",
      message: CONTACT_STATUS_MESSAGES.generic,
    });
    await expect(
      sendContactMessage({
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
