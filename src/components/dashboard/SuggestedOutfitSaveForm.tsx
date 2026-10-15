import type { ChangeEvent } from "react";
import { Alert, TextField } from "@mui/material";
import {
  getRecommendationTitle,
  type SuggestedOutfitView,
} from "../../api/outfitRecommendations";
import { dashboardCopy } from "../../content/dashboardCopy";
import { FormCard } from "./FormCard";
import { SuggestedOutfitItems } from "./SuggestedOutfitItems";

export type SuggestedOutfitSaveFormProps = {
  view: SuggestedOutfitView;
  name: string;
  isSaving: boolean;
  saveError?: string;
  onNameChange: (name: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export const SuggestedOutfitSaveForm = ({
  view,
  name,
  isSaving,
  saveError,
  onNameChange,
  onCancel,
  onSubmit,
}: SuggestedOutfitSaveFormProps) => {
  const copy = dashboardCopy.recommendations;
  const title = getRecommendationTitle(view.recommendation);

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onNameChange(event.target.value);
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleSubmit = () => {
    onSubmit();
  };

  return (
    <FormCard
      title={copy.saveLabel}
      onCancel={handleCancel}
      cancelLabel={dashboardCopy.settings.cancelLabel}
      submitLabel={copy.saveLabel}
      submittingLabel={copy.savingLabel}
      isSubmitting={isSaving}
      onSubmit={handleSubmit}
    >
      {saveError ? (
        <Alert severity="error" role="alert">
          {saveError}
        </Alert>
      ) : null}
      <TextField
        id="suggested-outfit-name"
        name="name"
        label={dashboardCopy.outfitForm.nameLabel}
        value={name}
        onChange={handleNameChange}
        fullWidth
        autoComplete="off"
        slotProps={{
          htmlInput: {
            maxLength: 100,
            "aria-label": dashboardCopy.outfitForm.nameLabel,
          },
        }}
      />
      <SuggestedOutfitItems items={view.items} label={`Items in ${title}`} />
    </FormCard>
  );
};
