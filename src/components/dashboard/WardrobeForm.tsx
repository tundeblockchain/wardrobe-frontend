import type { ChangeEvent } from "react";
import { Alert, TextField } from "@mui/material";
import type { FieldErrors, WardrobeFormValues } from "../../api/catalogValidation";
import { dashboardCopy } from "../../content/dashboardCopy";
import { FormCard } from "./FormCard";

export type WardrobeFormProps = {
  title: string;
  values: WardrobeFormValues;
  errors: FieldErrors<"name">;
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  formError?: string;
  onCancel: () => void;
  onValuesChange: (values: WardrobeFormValues) => void;
  onSubmit: () => void;
};

export const WardrobeForm = ({
  title,
  values,
  errors,
  isSubmitting,
  submitLabel,
  submittingLabel,
  formError,
  onCancel,
  onValuesChange,
  onSubmit,
}: WardrobeFormProps) => {
  const copy = dashboardCopy.wardrobeForm;

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValuesChange({ ...values, name: event.target.value });
  };

  return (
    <FormCard
      title={title}
      onCancel={onCancel}
      submitLabel={submitLabel}
      submittingLabel={submittingLabel}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    >
      {formError ? (
        <Alert severity="error" role="alert">
          {formError}
        </Alert>
      ) : null}
      <TextField
        id="wardrobe-name"
        name="name"
        label={copy.nameLabel}
        value={values.name}
        onChange={handleNameChange}
        error={Boolean(errors.name)}
        helperText={errors.name}
        required
        autoComplete="off"
        slotProps={{
          htmlInput: {
            "aria-label": copy.nameLabel,
            maxLength: 120,
          },
        }}
      />
    </FormCard>
  );
};
