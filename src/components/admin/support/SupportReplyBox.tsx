import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Button, Stack, TextField } from "@mui/material";
import { supportCopy } from "../../../admin/supportCopy";
import {
  REPLY_MESSAGE_MAX,
  validateReplyMessage,
} from "../../../api/adminSupport";

export type SupportReplyBoxProps = {
  disabled?: boolean;
  isSending?: boolean;
  onSend: (message: string) => Promise<void> | void;
};

export const SupportReplyBox = ({
  disabled = false,
  isSending = false,
  onSend,
}: SupportReplyBoxProps) => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isSubmittingRef = useRef(false);
  const remainingLabel = `${message.length}/${REPLY_MESSAGE_MAX}`;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || isSending || isSubmittingRef.current) {
      return;
    }

    const validationError = validateReplyMessage(message);
    if (validationError) {
      setError(validationError);
      return;
    }

    isSubmittingRef.current = true;
    try {
      await onSend(message.trim());
      setMessage("");
      setError("");
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <Stack
      component="form"
      noValidate
      onSubmit={handleSubmit}
      spacing={1.5}
      aria-label={supportCopy.replyAriaLabel}
    >
      <TextField
        id="support-reply-message"
        name="message"
        label={supportCopy.replyLabel}
        value={message}
        onChange={handleChange}
        multiline
        minRows={3}
        fullWidth
        disabled={disabled || isSending}
        error={Boolean(error)}
        helperText={error || remainingLabel}
        slotProps={{
          htmlInput: {
            maxLength: REPLY_MESSAGE_MAX + 1,
            "aria-required": true,
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={disabled || isSending}
        tabIndex={0}
        aria-label={isSending ? supportCopy.sendingReply : supportCopy.sendReply}
      >
        {isSending ? supportCopy.sendingReply : supportCopy.sendReply}
      </Button>
    </Stack>
  );
};
