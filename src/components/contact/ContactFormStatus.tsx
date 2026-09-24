import { Alert } from "@mui/material";

export type ContactFormStatusKind = "success" | "error" | "notice";

export type ContactFormStatusProps = {
  kind: ContactFormStatusKind;
  message: string;
};

export const ContactFormStatus = ({
  kind,
  message,
}: ContactFormStatusProps) => {
  if (!message) {
    return null;
  }

  const severity =
    kind === "success" ? "success" : kind === "error" ? "error" : "info";

  return (
    <Alert
      severity={severity}
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "error" ? "assertive" : "polite"}
    >
      {message}
    </Alert>
  );
};
