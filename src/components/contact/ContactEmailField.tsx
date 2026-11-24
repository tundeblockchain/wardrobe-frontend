import type { ChangeEvent } from "react";
import { TextField } from "@mui/material";
import { CONTACT_EMAIL_MAX } from "../../api/contact";

export type ContactEmailFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

export const ContactEmailField = ({
  value,
  onChange,
  error,
  disabled = false,
}: ContactEmailFieldProps) => {
  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange(event.target.value);
  };

  return (
    <TextField
      id="contact-email"
      name="email"
      label="Email"
      type="email"
      value={value}
      onChange={handleChange}
      required
      fullWidth
      disabled={disabled}
      autoComplete="email"
      error={Boolean(error)}
      helperText={error}
      slotProps={{
        htmlInput: {
          maxLength: CONTACT_EMAIL_MAX,
          "aria-required": true,
        },
      }}
    />
  );
};
