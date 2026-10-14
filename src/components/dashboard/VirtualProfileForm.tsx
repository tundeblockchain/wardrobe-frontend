import type { ChangeEvent, FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FaceRetouchingNaturalOutlined from "@mui/icons-material/FaceRetouchingNaturalOutlined";
import type {
  FieldErrors,
  VirtualProfileFormValues,
} from "../../api/catalogValidation";
import { dashboardCopy } from "../../content/dashboardCopy";
import { ResourceImage } from "./ResourceImage";

export type VirtualProfileFormProps = {
  values: VirtualProfileFormValues;
  errors: FieldErrors<"label" | "notes" | "image">;
  isSubmitting: boolean;
  isUploading: boolean;
  submitLabel: string;
  submittingLabel: string;
  uploadingLabel: string;
  imagePreviewUrl?: string;
  formError?: string;
  onValuesChange: (values: VirtualProfileFormValues) => void;
  onFileChange: (file: File | undefined) => void;
  onSubmit: () => void;
};

export const VirtualProfileForm = ({
  values,
  errors,
  isSubmitting,
  isUploading,
  submitLabel,
  submittingLabel,
  uploadingLabel,
  imagePreviewUrl,
  formError,
  onValuesChange,
  onFileChange,
  onSubmit,
}: VirtualProfileFormProps) => {
  const copy = dashboardCopy.virtualProfileForm;
  const isBusy = isSubmitting || isUploading;
  const actionLabel = isUploading
    ? uploadingLabel
    : isSubmitting
      ? submittingLabel
      : submitLabel;

  const handleFieldChange =
    (field: keyof VirtualProfileFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onValuesChange({
        ...values,
        [field]: event.target.value,
      });
    };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFileChange(event.target.files?.[0]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) {
      return;
    }

    onSubmit();
  };

  return (
    <Stack
      component="form"
      spacing={2.5}
      onSubmit={handleSubmit}
      noValidate
      aria-label={submitLabel}
    >
      {formError ? (
        <Alert severity="error" role="alert">
          {formError}
        </Alert>
      ) : null}
      <Box
        sx={{
          height: 240,
          border: 1,
          borderColor: errors.image ? "error.main" : "divider",
          overflow: "hidden",
        }}
      >
        <ResourceImage
          imageUrl={imagePreviewUrl}
          alt={values.label.trim() || copy.imageLabel}
          fallbackLabel="No photo selected"
          FallbackIcon={FaceRetouchingNaturalOutlined}
        />
      </Box>
      <Stack spacing={1}>
        <Button
          component="label"
          variant="outlined"
          color="secondary"
          tabIndex={0}
          aria-label={
            imagePreviewUrl ? copy.imageReplaceLabel : copy.imageChooseLabel
          }
        >
          {imagePreviewUrl ? copy.imageReplaceLabel : copy.imageChooseLabel}
          <input
            type="file"
            hidden
            accept="image/jpeg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp,.heic"
            onChange={handleFileChange}
            aria-label={copy.imageLabel}
          />
        </Button>
        {errors.image ? (
          <Typography variant="caption" color="error">
            {errors.image}
          </Typography>
        ) : null}
      </Stack>
      <TextField
        id="virtual-profile-label"
        name="label"
        label={copy.nameLabel}
        value={values.label}
        onChange={handleFieldChange("label")}
        error={Boolean(errors.label)}
        helperText={errors.label}
        autoComplete="off"
        slotProps={{
          htmlInput: { "aria-label": copy.nameLabel },
        }}
      />
      <TextField
        id="virtual-profile-notes"
        name="notes"
        label={copy.notesLabel}
        value={values.notes}
        onChange={handleFieldChange("notes")}
        error={Boolean(errors.notes)}
        helperText={errors.notes}
        multiline
        minRows={2}
        autoComplete="off"
        slotProps={{
          htmlInput: { "aria-label": copy.notesLabel },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={isBusy}
        tabIndex={0}
        aria-label={actionLabel}
      >
        {actionLabel}
      </Button>
    </Stack>
  );
};
