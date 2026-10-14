import type { ChangeEvent, FormEvent } from "react";
import { Alert, Button, Stack, TextField } from "@mui/material";
import type { FieldErrors, WardrobeFormValues } from "../../api/catalogValidation";
import { dashboardCopy } from "../../content/dashboardCopy";
import { FormCard } from "./FormCard";

export type WardrobeFormProps = {
  values: WardrobeFormValues;
  errors: FieldErrors<"name">;
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  formError?: string;
  onValuesChange: (values: WardrobeFormValues) => void;
  onSubmit: () => void;
};

export const WardrobeForm = ({
  values,
  errors,
  isSubmitting,
  submitLabel,
  submittingLabel,
  formError,
  onValuesChange,
  onSubmit,
}: WardrobeFormProps) => {
  const copy = dashboardCopy.wardrobeForm;

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValuesChange({ ...values, name: event.target.value });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
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
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isSubmitting}
          tabIndex={0}
          aria-label={isSubmitting ? submittingLabel : submitLabel}
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </Stack>
    </FormCard>
  );
};
