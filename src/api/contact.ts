export const CONTACT_NAME_MAX = 100;
export const CONTACT_EMAIL_MAX = 254;
export const CONTACT_SUBJECT_MAX = 200;
export const CONTACT_MESSAGE_MAX = 5000;

export const CONTACT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactFieldName = "name" | "email" | "subject" | "message";

export type ContactFormValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
  company: string;
};

export type ContactFieldErrors = Partial<Record<ContactFieldName, string>>;

export type ContactRequestBody = {
  name: string;
  email: string;
  message: string;
  company: string;
  subject?: string;
};

export type ContactSendResult =
  | { status: "success" }
  | { status: "validation"; message: string; fieldErrors: ContactFieldErrors }
  | { status: "rateLimited"; retryAfterSeconds?: number }
  | { status: "error"; message: string }
  | { status: "misconfigured" };

export type SendContactMessageInput = {
  apiBaseUrl: string | undefined;
  fields: ContactFormValues;
  fetchImpl?: typeof fetch;
};

export const CONTACT_STATUS_MESSAGES = {
  validation: "Please check the highlighted fields and try again.",
  validationGeneric: "Please check your details and try again.",
  originNotAllowed:
    "We couldn't send your message right now. Please try again later.",
  rateLimited: "You've sent too many messages. Please try again later.",
  generic: "Something went wrong. Please try again.",
  misconfigured:
    "The contact form is temporarily unavailable. Please try again later.",
} as const;

const CONTACT_FIELD_NAMES: ContactFieldName[] = [
  "name",
  "email",
  "subject",
  "message",
];

export const getSupportContactUrl = (apiBaseUrl: string): string => {
  return `${apiBaseUrl}/support/contact`;
};

export const buildContactRequestBody = (
  fields: ContactFormValues,
): ContactRequestBody => {
  const body: ContactRequestBody = {
    name: fields.name.trim(),
    email: fields.email.trim(),
    message: fields.message.trim(),
    company: fields.company,
  };

  const subject = fields.subject.trim();
  if (subject.length > 0) {
    body.subject = subject;
  }

  return body;
};

export const validateContactFormValues = (
  values: ContactFormValues,
): ContactFieldErrors => {
  const fieldErrors: ContactFieldErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const subject = values.subject.trim();
  const message = values.message.trim();

  if (name.length < 1) {
    fieldErrors.name = "Enter your name.";
  } else if (name.length > CONTACT_NAME_MAX) {
    fieldErrors.name = `Name must be ${CONTACT_NAME_MAX} characters or fewer.`;
  }

  if (email.length < 1) {
    fieldErrors.email = "Enter your email address.";
  } else if (email.length > CONTACT_EMAIL_MAX) {
    fieldErrors.email = `Email must be ${CONTACT_EMAIL_MAX} characters or fewer.`;
  } else if (!CONTACT_EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (subject.length > CONTACT_SUBJECT_MAX) {
    fieldErrors.subject = `Subject must be ${CONTACT_SUBJECT_MAX} characters or fewer.`;
  }

  if (message.length < 1) {
    fieldErrors.message = "Enter a message.";
  } else if (message.length > CONTACT_MESSAGE_MAX) {
    fieldErrors.message = `Message must be ${CONTACT_MESSAGE_MAX} characters or fewer.`;
  }

  return fieldErrors;
};

export const mapValidationFieldErrors = (
  message: string | undefined,
): ContactFieldErrors => {
  if (!message) {
    return {};
  }

  const lowerMessage = message.toLowerCase();
  const fieldErrors: ContactFieldErrors = {};

  CONTACT_FIELD_NAMES.forEach((fieldName) => {
    if (lowerMessage.includes(fieldName)) {
      fieldErrors[fieldName] = "Please check this field.";
    }
  });

  return fieldErrors;
};

export const formatRateLimitedMessage = (
  retryAfterSeconds?: number,
): string => {
  if (retryAfterSeconds === undefined) {
    return CONTACT_STATUS_MESSAGES.rateLimited;
  }

  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  const unit = minutes === 1 ? "minute" : "minutes";
  return `You've sent too many messages. Please try again in about ${minutes} ${unit}.`;
};

const readErrorRecord = (
  value: unknown,
): { code?: string; message?: string } => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const record = value as { error?: unknown };
  if (!record.error || typeof record.error !== "object") {
    return {};
  }

  const errorRecord = record.error as { code?: unknown; message?: unknown };
  return {
    code: typeof errorRecord.code === "string" ? errorRecord.code : undefined,
    message:
      typeof errorRecord.message === "string" ? errorRecord.message : undefined,
  };
};

const parseBackendError = async (
  response: Response,
): Promise<{ code?: string; message?: string }> => {
  try {
    const payload: unknown = await response.json();
    return readErrorRecord(payload);
  } catch {
    return {};
  }
};

const parseRetryAfterSeconds = (response: Response): number | undefined => {
  const rawValue = response.headers.get("Retry-After");
  if (!rawValue) {
    return undefined;
  }

  const seconds = Number.parseInt(rawValue.trim(), 10);
  if (!Number.isFinite(seconds) || seconds < 0) {
    return undefined;
  }

  return seconds;
};

export const sendContactMessage = async ({
  apiBaseUrl,
  fields,
  fetchImpl = fetch,
}: SendContactMessageInput): Promise<ContactSendResult> => {
  if (!apiBaseUrl) {
    return { status: "misconfigured" };
  }

  try {
    const response = await fetchImpl(getSupportContactUrl(apiBaseUrl), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "omit",
      body: JSON.stringify(buildContactRequestBody(fields)),
    });

    if (response.status === 202) {
      return { status: "success" };
    }

    if (response.status === 400) {
      const backendError = await parseBackendError(response);
      const fieldErrors = mapValidationFieldErrors(backendError.message);
      const hasFieldErrors = Object.keys(fieldErrors).length > 0;

      return {
        status: "validation",
        message: hasFieldErrors
          ? CONTACT_STATUS_MESSAGES.validation
          : CONTACT_STATUS_MESSAGES.validationGeneric,
        fieldErrors,
      };
    }

    if (response.status === 403) {
      return {
        status: "error",
        message: CONTACT_STATUS_MESSAGES.originNotAllowed,
      };
    }

    if (response.status === 429) {
      return {
        status: "rateLimited",
        retryAfterSeconds: parseRetryAfterSeconds(response),
      };
    }

    return { status: "error", message: CONTACT_STATUS_MESSAGES.generic };
  } catch {
    return { status: "error", message: CONTACT_STATUS_MESSAGES.generic };
  }
};
