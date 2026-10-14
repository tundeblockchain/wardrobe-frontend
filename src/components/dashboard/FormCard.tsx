import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { Button, Paper, Stack, Typography } from "@mui/material";

export const FORM_CARD_TEST_ID = "form-card";
export const FORM_CARD_HEADER_TEST_ID = "form-card-header";
export const FORM_CARD_CANCEL_TEST_ID = "form-card-cancel";
export const FORM_CARD_SUBMIT_TEST_ID = "form-card-submit";
export const FORM_CARD_MAX_WIDTH = 600;

export type FormCardProps = {
  title: string;
  children: ReactNode;
  onCancel: () => void;
  cancelLabel?: string;
  cancelAriaLabel?: string;
  submitLabel: string;
  submittingLabel?: string;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
  onSubmit: () => void;
};

export const FormCard = ({
  title,
  children,
  onCancel,
  cancelLabel = "Cancel",
  cancelAriaLabel,
  submitLabel,
  submittingLabel,
  isSubmitting = false,
  isSubmitDisabled = false,
  onSubmit,
}: FormCardProps) => {
  const resolvedCancelAriaLabel = cancelAriaLabel ?? cancelLabel;
  const isSubmitBusy = isSubmitting || isSubmitDisabled;
  const submitButtonLabel =
    isSubmitting && submittingLabel ? submittingLabel : submitLabel;

  const handleCancel = () => {
    onCancel();
  };

  const handleCancelKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleCancel();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitBusy) {
      return;
    }

    onSubmit();
  };

  return (
    <Paper
      elevation={0}
      data-testid={FORM_CARD_TEST_ID}
      sx={(theme) => ({
        width: "100%",
        maxWidth: FORM_CARD_MAX_WIDTH,
        mx: "auto",
        boxSizing: "border-box",
        p: { xs: 2.5, sm: 3 },
        border: 1,
        borderColor: theme.palette.divider,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      })}
    >
      <Stack
        component="form"
        spacing={2.5}
        onSubmit={handleSubmit}
        noValidate
        aria-label={submitLabel}
      >
        <Stack
          direction="row"
          spacing={2}
          data-testid={FORM_CARD_HEADER_TEST_ID}
          sx={{
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="h3"
            component="h2"
            sx={(theme) => ({
              minWidth: 0,
              color: theme.palette.text.primary,
            })}
          >
            {title}
          </Typography>
          <Button
            type="button"
            variant="text"
            color="secondary"
            onClick={handleCancel}
            onKeyDown={handleCancelKeyDown}
            tabIndex={0}
            aria-label={resolvedCancelAriaLabel}
            data-testid={FORM_CARD_CANCEL_TEST_ID}
            sx={{ flexShrink: 0 }}
          >
            {cancelLabel}
          </Button>
        </Stack>
        {children}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={isSubmitBusy}
          tabIndex={0}
          aria-label={submitButtonLabel}
          data-testid={FORM_CARD_SUBMIT_TEST_ID}
        >
          {submitButtonLabel}
        </Button>
      </Stack>
    </Paper>
  );
};
