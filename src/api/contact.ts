import { ApiError, isApiError, joinApiUrl } from "./httpClient";
import { publicRequest } from "./publicApi";

export const CONTACT_EMAIL_MAX = 254;
export const CONTACT_MESSAGE_MAX = 5000;
export const SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024;
export const DEVICE_LABEL_MAX = 120;
export const FEEDBACK_PLATFORM = "web" as const;

export const SCREENSHOT_CONTENT_TYPES = ["image/png", "image/jpeg"] as const;

export const CONTACT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const FEEDBACK_TYPES = ["bug", "query"] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
export type ScreenshotContentType = (typeof SCREENSHOT_CONTENT_TYPES)[number];

export type ContactFieldName = "type" | "email" | "message" | "screenshot";

export type ContactFormValues = {
  type: FeedbackType;
  email: string;
  message: string;
  website: string;
};

export type ContactFieldErrors = Partial<Record<ContactFieldName, string>>;

export type SupportUploadUrlResponse = {
  url: string;
  fields: Record<string, string>;
  screenshotKey: string;
};

export type SupportFeedbackRequest = {
  type: FeedbackType;
  message: string;
  email: string;
  screenshotKey?: string;
  appVersion?: string;
  platform: typeof FEEDBACK_PLATFORM;
  device?: string;
  website?: string;
};

export type ContactSendResult =
  | { status: "success"; conversationId: string }
  | { status: "validation"; message: string; fieldErrors: ContactFieldErrors }
  | { status: "rateLimited"; retryAfterSeconds?: number }
  | { status: "error"; message: string }
  | { status: "misconfigured" };

export type SubmitSupportFeedbackInput = {
  apiBaseUrl: string | undefined;
  fields: ContactFormValues;
  screenshotFile?: File;
  fetchImpl?: typeof fetch;
  userAgent?: string;
};

export const CONTACT_STATUS_MESSAGES = {
  validation:
    "Your message is too long or a field is invalid, please check and try again.",
  rateLimited: "Too many requests. Please try again in a few minutes.",
  generic: "Something went wrong. Please try again.",
  misconfigured:
    "The contact form is temporarily unavailable. Please try again later.",
  screenshotType: "Please choose a PNG or JPEG image.",
  screenshotSize: "Screenshots must be 5 MB or smaller.",
} as const;

const CONTACT_FIELD_ALIASES: Record<string, ContactFieldName> = {
  type: "type",
  email: "email",
  message: "message",
  screenshot: "screenshot",
  screenshotKey: "screenshot",
  screenshot_key: "screenshot",
  contentType: "screenshot",
  content_type: "screenshot",
};

export const isFeedbackType = (value: string): value is FeedbackType => {
  return FEEDBACK_TYPES.includes(value as FeedbackType);
};

export const isScreenshotContentType = (
  value: string,
): value is ScreenshotContentType => {
  return SCREENSHOT_CONTENT_TYPES.includes(value as ScreenshotContentType);
};

export const getSupportUploadUrl = (apiBaseUrl: string): string => {
  return joinApiUrl(apiBaseUrl, "/support/upload-url");
};

export const getSupportFeedbackUrl = (apiBaseUrl: string): string => {
  return joinApiUrl(apiBaseUrl, "/support/feedback");
};

const readBrowserLabel = (userAgent: string): string | undefined => {
  if (/Edg\//.test(userAgent)) {
    const version = userAgent.match(/Edg\/(\d+)/)?.[1];
    return version ? `Edge ${version}` : "Edge";
  }

  if (/Chrome\//.test(userAgent) && !/Edg\//.test(userAgent)) {
    const version = userAgent.match(/Chrome\/(\d+)/)?.[1];
    return version ? `Chrome ${version}` : "Chrome";
  }

  if (/Firefox\//.test(userAgent)) {
    const version = userAgent.match(/Firefox\/(\d+)/)?.[1];
    return version ? `Firefox ${version}` : "Firefox";
  }

  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) {
    const version = userAgent.match(/Version\/(\d+)/)?.[1];
    return version ? `Safari ${version}` : "Safari";
  }

  return undefined;
};

const readOsLabel = (userAgent: string): string | undefined => {
  if (/Windows NT/i.test(userAgent)) {
    return "Windows";
  }

  if (/Mac OS X|Macintosh/i.test(userAgent)) {
    return "macOS";
  }

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return "iOS";
  }

  if (/Android/i.test(userAgent)) {
    return "Android";
  }

  if (/CrOS/i.test(userAgent)) {
    return "Chrome OS";
  }

  if (/Linux/i.test(userAgent)) {
    return "Linux";
  }

  return undefined;
};

export const buildDeviceLabel = (
  userAgent: string,
  maxLength = DEVICE_LABEL_MAX,
): string => {
  const trimmed = userAgent.trim();
  if (!trimmed) {
    return "web";
  }

  const browser = readBrowserLabel(trimmed);
  const os = readOsLabel(trimmed);
  const parsed = [browser, os].filter(Boolean).join(" / ");
  const label = parsed.length > 0 ? parsed : trimmed;
  if (label.length <= maxLength) {
    return label;
  }

  return label.slice(0, maxLength);
};

export const resolveScreenshotContentType = (
  file: File,
): ScreenshotContentType | undefined => {
  if (file.type === "image/jpg") {
    return "image/jpeg";
  }

  if (isScreenshotContentType(file.type)) {
    return file.type;
  }

  const fileName = file.name.toLowerCase();
  if (fileName.endsWith(".png")) {
    return "image/png";
  }

  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  return undefined;
};

export const validateScreenshotFile = (file: File): string | undefined => {
  if (!resolveScreenshotContentType(file)) {
    return CONTACT_STATUS_MESSAGES.screenshotType;
  }

  if (file.size > SCREENSHOT_MAX_BYTES) {
    return CONTACT_STATUS_MESSAGES.screenshotSize;
  }

  return undefined;
};

export const validateContactFormValues = (
  values: ContactFormValues,
): ContactFieldErrors => {
  const fieldErrors: ContactFieldErrors = {};
  const email = values.email.trim();
  const message = values.message.trim();

  if (!isFeedbackType(values.type)) {
    fieldErrors.type = "Choose Bug report or Question.";
  }

  if (email.length < 1) {
    fieldErrors.email = "Enter your email address.";
  } else if (email.length > CONTACT_EMAIL_MAX) {
    fieldErrors.email = `Email must be ${CONTACT_EMAIL_MAX} characters or fewer.`;
  } else if (!CONTACT_EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (message.length < 1) {
    fieldErrors.message = "Enter a message.";
  } else if (message.length > CONTACT_MESSAGE_MAX) {
    fieldErrors.message = `Message must be ${CONTACT_MESSAGE_MAX} characters or fewer.`;
  }

  return fieldErrors;
};

export const mapValidationFieldErrors = (
  fields: Record<string, string> | undefined,
): ContactFieldErrors => {
  if (!fields) {
    return {};
  }

  const fieldErrors: ContactFieldErrors = {};
  Object.entries(fields).forEach(([name, reason]) => {
    const fieldName = CONTACT_FIELD_ALIASES[name];
    if (!fieldName) {
      return;
    }

    fieldErrors[fieldName] = reason;
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
  return `Too many requests. Please try again in ${minutes} ${unit}.`;
};

export const buildFeedbackRequestBody = ({
  fields,
  screenshotKey,
  device,
  appVersion,
}: {
  fields: ContactFormValues;
  screenshotKey?: string;
  device?: string;
  appVersion?: string;
}): SupportFeedbackRequest => {
  const body: SupportFeedbackRequest = {
    type: fields.type,
    message: fields.message.trim(),
    email: fields.email.trim(),
    platform: FEEDBACK_PLATFORM,
    website: fields.website,
  };

  if (screenshotKey) {
    body.screenshotKey = screenshotKey;
  }

  if (device) {
    body.device = device;
  }

  if (appVersion) {
    body.appVersion = appVersion;
  }

  return body;
};

export const buildPresignedPostFormData = (
  fields: Record<string, string>,
  file: Blob,
  fileName: string,
): FormData => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });
  formData.append("file", file, fileName);
  return formData;
};

export const listFormDataKeys = (formData: FormData): string[] => {
  return Array.from(formData.keys());
};

export const parseUploadUrlResponse = (
  payload: unknown,
): SupportUploadUrlResponse => {
  if (!payload || typeof payload !== "object") {
    throw new ApiError({
      status: 0,
      code: "NETWORK",
      message: CONTACT_STATUS_MESSAGES.generic,
    });
  }

  const record = payload as {
    url?: unknown;
    fields?: unknown;
    screenshotKey?: unknown;
  };

  if (typeof record.url !== "string" || record.url.trim().length === 0) {
    throw new ApiError({
      status: 0,
      code: "NETWORK",
      message: CONTACT_STATUS_MESSAGES.generic,
    });
  }

  if (
    typeof record.screenshotKey !== "string" ||
    record.screenshotKey.trim().length === 0
  ) {
    throw new ApiError({
      status: 0,
      code: "NETWORK",
      message: CONTACT_STATUS_MESSAGES.generic,
    });
  }

  if (!record.fields || typeof record.fields !== "object") {
    throw new ApiError({
      status: 0,
      code: "NETWORK",
      message: CONTACT_STATUS_MESSAGES.generic,
    });
  }

  const fields: Record<string, string> = {};
  Object.entries(record.fields as Record<string, unknown>).forEach(
    ([key, value]) => {
      if (typeof value === "string") {
        fields[key] = value;
      }
    },
  );

  return {
    url: record.url.trim(),
    fields,
    screenshotKey: record.screenshotKey.trim(),
  };
};

const readConversationId = (payload: unknown): string => {
  if (!payload || typeof payload !== "object") {
    throw new ApiError({
      status: 0,
      code: "NETWORK",
      message: CONTACT_STATUS_MESSAGES.generic,
    });
  }

  const conversationId = (payload as { conversationId?: unknown })
    .conversationId;
  if (typeof conversationId !== "string") {
    throw new ApiError({
      status: 0,
      code: "NETWORK",
      message: CONTACT_STATUS_MESSAGES.generic,
    });
  }

  const trimmedId = conversationId.trim();
  if (trimmedId.length === 0) {
    throw new ApiError({
      status: 0,
      code: "NETWORK",
      message: CONTACT_STATUS_MESSAGES.generic,
    });
  }

  return trimmedId;
};

const mapRequestError = (error: unknown): ContactSendResult => {
  if (!isApiError(error)) {
    return { status: "error", message: CONTACT_STATUS_MESSAGES.generic };
  }

  if (error.status === 429 || error.code === "rate_limited") {
    return {
      status: "rateLimited",
      retryAfterSeconds: error.retryAfterSeconds,
    };
  }

  if (error.status === 400 || error.code === "validation") {
    return {
      status: "validation",
      message: CONTACT_STATUS_MESSAGES.validation,
      fieldErrors: mapValidationFieldErrors(error.fields),
    };
  }

  return { status: "error", message: CONTACT_STATUS_MESSAGES.generic };
};

export const requestSupportUploadUrl = async ({
  apiBaseUrl,
  contentType,
  fetchImpl = fetch,
}: {
  apiBaseUrl: string;
  contentType: ScreenshotContentType;
  fetchImpl?: typeof fetch;
}): Promise<SupportUploadUrlResponse> => {
  const payload = await publicRequest<unknown>("/support/upload-url", {
    method: "POST",
    baseUrl: apiBaseUrl,
    credentials: "omit",
    body: { contentType },
    fetchImpl,
  });

  return parseUploadUrlResponse(payload);
};

export const postFileToPresignedPost = async ({
  url,
  fields,
  file,
  fileName,
  fetchImpl = fetch,
}: {
  url: string;
  fields: Record<string, string>;
  file: Blob;
  fileName: string;
  fetchImpl?: typeof fetch;
}): Promise<void> => {
  const formData = buildPresignedPostFormData(fields, file, fileName);
  let response: Response;

  try {
    response = await fetchImpl(url, {
      method: "POST",
      body: formData,
      credentials: "omit",
    });
  } catch (error) {
    throw new ApiError({
      status: 0,
      code: "NETWORK",
      message:
        error instanceof Error
          ? error.message
          : CONTACT_STATUS_MESSAGES.generic,
    });
  }

  if (response.ok) {
    return;
  }

  throw new ApiError({
    status: response.status,
    code: "UPLOAD_FAILED",
    message: CONTACT_STATUS_MESSAGES.generic,
  });
};

export const sendSupportFeedback = async ({
  apiBaseUrl,
  body,
  fetchImpl = fetch,
}: {
  apiBaseUrl: string;
  body: SupportFeedbackRequest;
  fetchImpl?: typeof fetch;
}): Promise<{ conversationId: string }> => {
  const payload = await publicRequest<unknown>("/support/feedback", {
    method: "POST",
    baseUrl: apiBaseUrl,
    credentials: "omit",
    body,
    fetchImpl,
  });

  return { conversationId: readConversationId(payload) };
};

export const submitSupportFeedback = async ({
  apiBaseUrl,
  fields,
  screenshotFile,
  fetchImpl = fetch,
  userAgent,
}: SubmitSupportFeedbackInput): Promise<ContactSendResult> => {
  if (!apiBaseUrl) {
    return { status: "misconfigured" };
  }

  const fieldErrors = validateContactFormValues(fields);
  if (screenshotFile) {
    const screenshotError = validateScreenshotFile(screenshotFile);
    if (screenshotError) {
      fieldErrors.screenshot = screenshotError;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "validation",
      message: CONTACT_STATUS_MESSAGES.validation,
      fieldErrors,
    };
  }

  try {
    let screenshotKey: string | undefined;

    if (screenshotFile) {
      const contentType = resolveScreenshotContentType(screenshotFile);
      if (!contentType) {
        return {
          status: "validation",
          message: CONTACT_STATUS_MESSAGES.validation,
          fieldErrors: { screenshot: CONTACT_STATUS_MESSAGES.screenshotType },
        };
      }

      const upload = await requestSupportUploadUrl({
        apiBaseUrl,
        contentType,
        fetchImpl,
      });

      await postFileToPresignedPost({
        url: upload.url,
        fields: upload.fields,
        file: screenshotFile,
        fileName: screenshotFile.name || "screenshot",
        fetchImpl,
      });

      screenshotKey = upload.screenshotKey;
    }

    const result = await sendSupportFeedback({
      apiBaseUrl,
      body: buildFeedbackRequestBody({
        fields,
        screenshotKey,
        device: buildDeviceLabel(userAgent ?? ""),
      }),
      fetchImpl,
    });

    return { status: "success", conversationId: result.conversationId };
  } catch (error) {
    return mapRequestError(error);
  }
};
