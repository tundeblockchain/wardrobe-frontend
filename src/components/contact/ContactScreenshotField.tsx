import type { ChangeEvent, KeyboardEvent } from "react";
import CloseIcon from "@mui/icons-material/Close";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import {
  Box,
  Button,
  FormHelperText,
  FormLabel,
  IconButton,
  Stack,
} from "@mui/material";

export type ContactScreenshotFieldProps = {
  fileName?: string;
  previewUrl?: string;
  error?: string;
  disabled?: boolean;
  onFileChange: (file: File | undefined) => void;
};

export const ContactScreenshotField = ({
  fileName,
  previewUrl,
  error,
  disabled = false,
  onFileChange,
}: ContactScreenshotFieldProps) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    onFileChange(nextFile);
    event.target.value = "";
  };

  const handleRemoveClick = () => {
    onFileChange(undefined);
  };

  const handleRemoveKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleRemoveClick();
  };

  const helperText = error ?? "PNG or JPEG, up to 5 MB. Optional.";
  const chooseLabel = previewUrl ? "Replace screenshot" : "Add a screenshot";

  return (
    <Stack spacing={1.25}>
      <FormLabel id="contact-screenshot-label" error={Boolean(error)}>
        Screenshot (optional)
      </FormLabel>
      {previewUrl ? (
        <Box
          sx={{
            position: "relative",
            border: 1,
            borderColor: error ? "error.main" : "divider",
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "action.hover",
          }}
        >
          <Box
            component="img"
            src={previewUrl}
            alt={fileName ? `Preview of ${fileName}` : "Selected screenshot preview"}
            sx={{
              display: "block",
              width: "100%",
              maxHeight: { xs: 180, sm: 240 },
              objectFit: "contain",
            }}
          />
          <IconButton
            type="button"
            onClick={handleRemoveClick}
            onKeyDown={handleRemoveKeyDown}
            tabIndex={0}
            aria-label="Remove screenshot"
            disabled={disabled}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "background.paper",
              "&:hover": { bgcolor: "background.paper" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : null}
      <Button
        component="label"
        variant="outlined"
        color="secondary"
        disabled={disabled}
        tabIndex={0}
        startIcon={<ImageOutlined aria-hidden="true" />}
        aria-label={chooseLabel}
        sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
      >
        {chooseLabel}
        <input
          type="file"
          name="screenshot"
          hidden
          accept="image/png,image/jpeg,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          disabled={disabled}
          aria-labelledby="contact-screenshot-label"
          aria-label="Attach a PNG or JPEG screenshot"
        />
      </Button>
      <FormHelperText error={Boolean(error)} id="contact-screenshot-helper">
        {helperText}
      </FormHelperText>
    </Stack>
  );
};
