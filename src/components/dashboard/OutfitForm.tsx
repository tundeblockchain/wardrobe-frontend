import type { ChangeEvent } from "react";
import {
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import type { FieldErrors, OutfitFormValues } from "../../api/catalogValidation";
import { getClothingCategoryLabel } from "../../api/resourceDisplay";
import type { ClothingItem, Wardrobe } from "../../api/resourceTypes";
import { dashboardCopy } from "../../content/dashboardCopy";
import { FormCard } from "./FormCard";

export type OutfitFormProps = {
  title: string;
  values: OutfitFormValues;
  errors: FieldErrors<"name" | "wardrobeId" | "items">;
  wardrobes: Wardrobe[];
  clothingItems: ClothingItem[];
  wardrobeLocked?: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  formError?: string;
  onCancel: () => void;
  onValuesChange: (values: OutfitFormValues) => void;
  onSubmit: () => void;
};

export const OutfitForm = ({
  title,
  values,
  errors,
  wardrobes,
  clothingItems,
  wardrobeLocked = false,
  isSubmitting,
  submitLabel,
  submittingLabel,
  formError,
  onCancel,
  onValuesChange,
  onSubmit,
}: OutfitFormProps) => {
  const copy = dashboardCopy.outfitForm;

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValuesChange({ ...values, name: event.target.value });
  };

  const handleWardrobeChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValuesChange({
      ...values,
      wardrobeId: event.target.value,
      items: [],
    });
  };

  const handleItemToggle = (item: ClothingItem) => {
    const isSelected = values.items.some(
      (entry) => entry.itemId === item.itemId,
    );
    const nextItems = isSelected
      ? values.items.filter((entry) => entry.itemId !== item.itemId)
      : [...values.items, { itemId: item.itemId, slot: item.category }];

    onValuesChange({
      ...values,
      items: nextItems,
    });
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
        id="outfit-name"
        name="name"
        label={copy.nameLabel}
        value={values.name}
        onChange={handleNameChange}
        error={Boolean(errors.name)}
        helperText={errors.name}
        required
        autoComplete="off"
        slotProps={{
          htmlInput: { "aria-label": copy.nameLabel },
        }}
      />
      <TextField
        id="outfit-wardrobe"
        name="wardrobeId"
        label={copy.wardrobeLabel}
        value={values.wardrobeId}
        onChange={handleWardrobeChange}
        error={Boolean(errors.wardrobeId)}
        helperText={errors.wardrobeId}
        required
        select
        disabled={wardrobeLocked}
        slotProps={{
          htmlInput: { "aria-label": copy.wardrobeLabel },
        }}
      >
        {wardrobes.map((wardrobe) => (
          <MenuItem key={wardrobe.wardrobeId} value={wardrobe.wardrobeId}>
            {wardrobe.name}
          </MenuItem>
        ))}
      </TextField>
      <Box>
        <Typography
          id="outfit-items-label"
          variant="subtitle2"
          component="h2"
          sx={{ mb: 1 }}
        >
          {copy.itemsLabel}
        </Typography>
        {clothingItems.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {copy.itemsEmpty}
          </Typography>
        ) : (
          <FormGroup aria-labelledby="outfit-items-label">
            {clothingItems.map((item) => {
              const isChecked = values.items.some(
                (entry) => entry.itemId === item.itemId,
              );
              const itemLabel = `${item.name} (${getClothingCategoryLabel(item.category)})`;
              return (
                <FormControlLabel
                  key={item.itemId}
                  control={
                    <Checkbox
                      checked={isChecked}
                      onChange={() => {
                        handleItemToggle(item);
                      }}
                      slotProps={{
                        input: { "aria-label": itemLabel },
                      }}
                    />
                  }
                  label={itemLabel}
                />
              );
            })}
          </FormGroup>
        )}
        {errors.items ? (
          <Typography variant="caption" color="error">
            {errors.items}
          </Typography>
        ) : null}
      </Box>
    </FormCard>
  );
};
