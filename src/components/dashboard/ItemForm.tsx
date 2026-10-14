import type { ChangeEvent, FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckroomOutlined from "@mui/icons-material/CheckroomOutlined";
import type { FieldErrors, ItemFormValues } from "../../api/catalogValidation";
import { CLOTHING_CATEGORIES } from "../../api/resourceTypes";
import { getClothingCategoryLabel } from "../../api/resourceDisplay";
import { dashboardCopy } from "../../content/dashboardCopy";
import { FormCard } from "./FormCard";
import { ResourceImage } from "./ResourceImage";

export type ItemFormProps = {
  values: ItemFormValues;
  errors: FieldErrors<
    "name" | "category" | "colours" | "acquiredAt" | "image"
  >;
  isSubmitting: boolean;
  isUploading: boolean;
  submitLabel: string;
  submittingLabel: string;
  uploadingLabel: string;
  imagePreviewUrl?: string;
  formError?: string;
  onValuesChange: (values: ItemFormValues) => void;
  onFileChange: (file: File | undefined) => void;
  onSubmit: () => void;
};

export const ItemForm = ({
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
}: ItemFormProps) => {
  const copy = dashboardCopy.itemForm;
  const isBusy = isSubmitting || isUploading;
  const actionLabel = isUploading
    ? uploadingLabel
    : isSubmitting
      ? submittingLabel
      : submitLabel;

  const handleFieldChange =
    (field: keyof ItemFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onValuesChange({
        ...values,
        [field]: event.target.value,
      });
    };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onFileChange(file);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) {
      return;
    }

    onSubmit();
  };

  return (
    <FormCard>
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
            alt={values.name.trim() || copy.imageLabel}
            fallbackLabel="No photo selected"
            FallbackIcon={CheckroomOutlined}
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
          id="item-name"
          name="name"
          label={copy.nameLabel}
          value={values.name}
          onChange={handleFieldChange("name")}
          error={Boolean(errors.name)}
          helperText={errors.name}
          required
          autoComplete="off"
          slotProps={{
            htmlInput: { "aria-label": copy.nameLabel },
          }}
        />
        <TextField
          id="item-category"
          name="category"
          label={copy.categoryLabel}
          value={values.category}
          onChange={handleFieldChange("category")}
          error={Boolean(errors.category)}
          helperText={errors.category}
          required
          select
          slotProps={{
            htmlInput: { "aria-label": copy.categoryLabel },
          }}
        >
          {CLOTHING_CATEGORIES.map((category) => (
            <MenuItem key={category} value={category}>
              {getClothingCategoryLabel(category)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          id="item-subcategory"
          name="subcategory"
          label={copy.subcategoryLabel}
          value={values.subcategory}
          onChange={handleFieldChange("subcategory")}
          autoComplete="off"
          slotProps={{
            htmlInput: { "aria-label": copy.subcategoryLabel },
          }}
        />
        <TextField
          id="item-colours"
          name="colours"
          label={copy.coloursLabel}
          value={values.colours}
          onChange={handleFieldChange("colours")}
          error={Boolean(errors.colours)}
          helperText={errors.colours ?? copy.coloursHelper}
          autoComplete="off"
          slotProps={{
            htmlInput: { "aria-label": copy.coloursLabel },
          }}
        />
        <TextField
          id="item-brand"
          name="brand"
          label={copy.brandLabel}
          value={values.brand}
          onChange={handleFieldChange("brand")}
          autoComplete="off"
          slotProps={{
            htmlInput: { "aria-label": copy.brandLabel },
          }}
        />
        <TextField
          id="item-acquired-at"
          name="acquiredAt"
          label={copy.acquiredAtLabel}
          type="date"
          value={values.acquiredAt}
          onChange={handleFieldChange("acquiredAt")}
          error={Boolean(errors.acquiredAt)}
          helperText={errors.acquiredAt}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { "aria-label": copy.acquiredAtLabel },
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
    </FormCard>
  );
};
