import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CONTACT_EMAIL_MAX,
  CONTACT_MESSAGE_MAX,
  CONTACT_NAME_MAX,
  CONTACT_STATUS_MESSAGES,
  CONTACT_SUBJECT_MAX,
  formatRateLimitedMessage,
  sendContactMessage,
  validateContactFormValues,
  type ContactFieldErrors,
  type ContactFieldName,
  type ContactFormValues,
  type SendContactMessageInput,
} from "../../api/contact";
import { ContactFormStatus } from "./ContactFormStatus";
import { ContactHoneypotField } from "./ContactHoneypotField";

export type ContactFormProps = {
  appName: string;
  apiBaseUrl: string | undefined;
  sendMessage?: (input: SendContactMessageInput) => ReturnType<
    typeof sendContactMessage
  >;
};

const EMPTY_VALUES: ContactFormValues = {
  name: "",
  email: "",
  subject: "",
  message: "",
  company: "",
};

export const ContactForm = ({
  appName,
  apiBaseUrl,
  sendMessage = sendContactMessage,
}: ContactFormProps) => {
  const [values, setValues] = useState<ContactFormValues>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusKind, setStatusKind] = useState<
    "idle" | "success" | "error" | "notice"
  >(apiBaseUrl ? "idle" : "notice");
  const [statusMessage, setStatusMessage] = useState(
    apiBaseUrl ? "" : CONTACT_STATUS_MESSAGES.misconfigured,
  );

  const isApiConfigured = Boolean(apiBaseUrl);
  const isSuccess = statusKind === "success";

  const handleValueChange =
    (field: keyof ContactFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value;
      setValues((currentValues) => ({
        ...currentValues,
        [field]: nextValue,
      }));

      if (field === "company") {
        return;
      }

      const fieldName = field as ContactFieldName;
      setFieldErrors((currentErrors) => {
        if (!currentErrors[fieldName]) {
          return currentErrors;
        }

        const nextErrors = { ...currentErrors };
        delete nextErrors[fieldName];
        return nextErrors;
      });
    };

  const handleCompanyChange = (nextValue: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      company: nextValue,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !isApiConfigured) {
      return;
    }

    const nextFieldErrors = validateContactFormValues(values);
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

    const result = await sendMessage({
      apiBaseUrl,
      fields: values,
    });

    setIsSubmitting(false);

    if (result.status === "success") {
      setStatusKind("success");
      setStatusMessage(
        `Thanks for contacting ${appName}. We received your message and will reply if a response is needed.`,
      );
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
    setValues(EMPTY_VALUES);
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
          value={values.company}
          onChange={handleCompanyChange}
        />

        <TextField
          id="contact-name"
          name="name"
          label="Name"
          value={values.name}
          onChange={handleValueChange("name")}
          required
          fullWidth
          autoComplete="name"
          error={Boolean(fieldErrors.name)}
          helperText={fieldErrors.name}
          slotProps={{
            htmlInput: {
              maxLength: CONTACT_NAME_MAX,
              "aria-required": true,
            },
          }}
        />

        <TextField
          id="contact-email"
          name="email"
          label="Email"
          type="email"
          value={values.email}
          onChange={handleValueChange("email")}
          required
          fullWidth
          autoComplete="email"
          error={Boolean(fieldErrors.email)}
          helperText={fieldErrors.email}
          slotProps={{
            htmlInput: {
              maxLength: CONTACT_EMAIL_MAX,
              "aria-required": true,
            },
          }}
        />

        <TextField
          id="contact-subject"
          name="subject"
          label="Subject"
          value={values.subject}
          onChange={handleValueChange("subject")}
          fullWidth
          autoComplete="off"
          error={Boolean(fieldErrors.subject)}
          helperText={fieldErrors.subject ?? "Optional"}
          slotProps={{
            htmlInput: {
              maxLength: CONTACT_SUBJECT_MAX,
            },
          }}
        />

        <TextField
          id="contact-message"
          name="message"
          label="Message"
          value={values.message}
          onChange={handleValueChange("message")}
          required
          fullWidth
          multiline
          minRows={5}
          error={Boolean(fieldErrors.message)}
          helperText={
            fieldErrors.message ??
            `${values.message.length} / ${CONTACT_MESSAGE_MAX}`
          }
          slotProps={{
            htmlInput: {
              maxLength: CONTACT_MESSAGE_MAX,
              "aria-required": true,
            },
          }}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ alignItems: { sm: "center" } }}
        >
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!isApiConfigured || isSubmitting}
            tabIndex={0}
            aria-label="Send contact message"
            startIcon={
              isSubmitting ? (
                <CircularProgress size={16} color="inherit" aria-hidden="true" />
              ) : undefined
            }
          >
            {isSubmitting ? "Sending…" : "Send message"}
          </Button>
          <Typography variant="body2" color="text.secondary">
            We never share the details you send through this form.
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
};
