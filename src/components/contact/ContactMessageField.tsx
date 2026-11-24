import type { ChangeEvent } from "react";
import { TextField } from "@mui/material";
import { CONTACT_MESSAGE_MAX } from "../../api/contact";

export type ContactMessageFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

export const ContactMessageField = ({
  value,
  onChange,
  error,
  disabled = false,
}: ContactMessageFieldProps) => {
  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange(event.target.value);
  };

  const counter = `${value.length} / ${CONTACT_MESSAGE_MAX}`;

  return (
    <TextField
      id="contact-message"
      name="message"
      label="Message"
      value={value}
      onChange={handleChange}
      required
      fullWidth
      disabled={disabled}
      multiline
      minRows={5}
      error={Boolean(error)}
      helperText={error ? `${error} ${counter}` : counter}
      slotProps={{
        htmlInput: {
          maxLength: CONTACT_MESSAGE_MAX,
          "aria-required": true,
        },
      }}
    />
  );
};
