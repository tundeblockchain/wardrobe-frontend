import { useState, type FormEvent } from "react";
import { Box, Button, Stack } from "@mui/material";
import {
  CONTACT_STATUS_MESSAGES,
  formatRateLimitedMessage,
  submitSupportFeedback,
  validateContactFormValues,
  validateScreenshotFile,
  type ContactFieldErrors,
  type ContactFieldName,
  type ContactFormValues,
  type FeedbackType,
  type SubmitSupportFeedbackInput,
} from "../../api/contact";
import { trackEvent } from "../../config/trackingEvents";
import { ContactEmailField } from "./ContactEmailField";
import { ContactFormStatus } from "./ContactFormStatus";
import { ContactHoneypotField } from "./ContactHoneypotField";
import { ContactMessageField } from "./ContactMessageField";
import { ContactScreenshotField } from "./ContactScreenshotField";
import { ContactSubmitRow } from "./ContactSubmitRow";
import { ContactTypeSelector } from "./ContactTypeSelector";

export type ContactFormProps = {
  appName: string;
  apiBaseUrl: string | undefined;
  initialType?: FeedbackType;
  submitFeedback?: (
    input: SubmitSupportFeedbackInput,
  ) => ReturnType<typeof submitSupportFeedback>;
};

const EMPTY_VALUES: ContactFormValues = {
  type: "query",
  email: "",
  message: "",
  website: "",
};

const createInitialValues = (
  initialType: FeedbackType = "query",
): ContactFormValues => {
  return {
    ...EMPTY_VALUES,
    type: initialType,
  };
};

export const ContactForm = ({
  appName,
  apiBaseUrl,
  initialType = "query",
  submitFeedback = submitSupportFeedback,
}: ContactFormProps) => {
  const [values, setValues] = useState<ContactFormValues>(() =>
    createInitialValues(initialType),
  );
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [screenshotFile, setScreenshotFile] = useState<File | undefined>();
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<
    string | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusKind, setStatusKind] = useState<
    "idle" | "success" | "error" | "notice"
  >(apiBaseUrl ? "idle" : "notice");
  const [statusMessage, setStatusMessage] = useState(
    apiBaseUrl ? "" : CONTACT_STATUS_MESSAGES.misconfigured,
  );

  const isApiConfigured = Boolean(apiBaseUrl);
  const isSuccess = statusKind === "success";

  const clearFieldError = (field: ContactFieldName) => {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[field]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleTypeChange = (nextType: FeedbackType) => {
    setValues((currentValues) => ({
      ...currentValues,
      type: nextType,
    }));
    clearFieldError("type");
  };

  const handleEmailChange = (nextValue: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      email: nextValue,
    }));
    clearFieldError("email");
  };

  const handleMessageChange = (nextValue: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      message: nextValue,
    }));
    clearFieldError("message");
  };

  const handleWebsiteChange = (nextValue: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      website: nextValue,
    }));
  };

  const revokeScreenshotPreview = () => {
    setScreenshotPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return undefined;
    });
  };

  const handleScreenshotChange = (nextFile: File | undefined) => {
    if (!nextFile) {
      revokeScreenshotPreview();
      setScreenshotFile(undefined);
      clearFieldError("screenshot");
      return;
    }

    const screenshotError = validateScreenshotFile(nextFile);
    if (screenshotError) {
      revokeScreenshotPreview();
      setScreenshotFile(undefined);
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        screenshot: screenshotError,
      }));
      return;
    }

    setScreenshotPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return URL.createObjectURL(nextFile);
    });
    setScreenshotFile(nextFile);
    clearFieldError("screenshot");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !isApiConfigured) {
      return;
    }

    const nextFieldErrors = validateContactFormValues(values);
    if (screenshotFile) {
      const screenshotError = validateScreenshotFile(screenshotFile);
      if (screenshotError) {
        nextFieldErrors.screenshot = screenshotError;
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setStatusKind("error");
      setStatusMessage(CONTACT_STATUS_MESSAGES.validation);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setStatusKind("idle");
    setStatusMessage("");

    const result = await submitFeedback({
      apiBaseUrl,
      fields: values,
      screenshotFile,
      userAgent: navigator.userAgent,
    });

    setIsSubmitting(false);

    if (result.status === "success") {
      handleScreenshotChange(undefined);
      setValues(createInitialValues(initialType));
      setStatusKind("success");
      setStatusMessage(
        `Thanks for contacting ${appName}. We received your message and will reply if a response is needed.`,
      );
      trackEvent("contact", {
        form_type: values.type,
      });
      return;
    }

    if (result.status === "validation") {
      setFieldErrors(result.fieldErrors);
      setStatusKind("error");
      setStatusMessage(result.message);
      return;
    }

    if (result.status === "rateLimited") {
      setStatusKind("error");
      setStatusMessage(formatRateLimitedMessage(result.retryAfterSeconds));
      return;
    }

    if (result.status === "misconfigured") {
      setStatusKind("notice");
      setStatusMessage(CONTACT_STATUS_MESSAGES.misconfigured);
      return;
    }

    setStatusKind("error");
    setStatusMessage(result.message);
  };

  const handleSendAnotherClick = () => {
    handleScreenshotChange(undefined);
    setValues(createInitialValues(initialType));
    setFieldErrors({});
    setStatusKind("idle");
    setStatusMessage("");
  };

  if (isSuccess) {
    return (
      <Stack spacing={2}>
        <ContactFormStatus kind="success" message={statusMessage} />
        <Button
          type="button"
          variant="outlined"
          color="primary"
          onClick={handleSendAnotherClick}
          tabIndex={0}
          aria-label="Send another contact message"
        >
          Send another message
        </Button>
      </Stack>
    );
  }

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit}
      aria-label="Contact form"
      sx={{ position: "relative" }}
    >
      <Stack spacing={2.5}>
        {statusKind === "notice" ? (
          <ContactFormStatus kind="notice" message={statusMessage} />
        ) : null}
        {statusKind === "error" ? (
          <ContactFormStatus kind="error" message={statusMessage} />
        ) : null}

        <ContactHoneypotField
          value={values.website}
          onChange={handleWebsiteChange}
        />

        <ContactTypeSelector
          value={values.type}
          onChange={handleTypeChange}
          error={fieldErrors.type}
          disabled={isSubmitting}
        />

        <ContactEmailField
          value={values.email}
          onChange={handleEmailChange}
          error={fieldErrors.email}
          disabled={isSubmitting}
        />

        <ContactMessageField
          value={values.message}
          onChange={handleMessageChange}
          error={fieldErrors.message}
          disabled={isSubmitting}
        />

        <ContactScreenshotField
          fileName={screenshotFile?.name}
          previewUrl={screenshotPreviewUrl}
          error={fieldErrors.screenshot}
          disabled={isSubmitting}
          onFileChange={handleScreenshotChange}
        />

        <ContactSubmitRow
          isSubmitting={isSubmitting}
          disabled={!isApiConfigured}
        />
      </Stack>
    </Box>
  );
};
