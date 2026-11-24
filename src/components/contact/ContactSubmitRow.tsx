import { Button, CircularProgress, Stack, Typography } from "@mui/material";

export type ContactSubmitRowProps = {
  isSubmitting: boolean;
  disabled?: boolean;
};

export const ContactSubmitRow = ({
  isSubmitting,
  disabled = false,
}: ContactSubmitRowProps) => {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      sx={{ alignItems: { sm: "center" } }}
    >
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={disabled || isSubmitting}
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
  );
};
