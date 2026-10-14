import { useState } from "react";
import { Alert, Button, Stack } from "@mui/material";
import {
  Link as RouterLink,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { getForbiddenUpgradeKind } from "../../api/entitlementGating";
import { isApiError } from "../../api/httpClient";
import {
  getRecommendationReason,
  getRecommendationTitle,
  readSuggestedOutfitState,
  toCreateOutfitRequest,
} from "../../api/outfitRecommendations";
import type { ResourceApi } from "../../api/resourceApi";
import { useResourceApi } from "../../api/useResourceApi";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ForbiddenUpgradePrompt } from "../../components/dashboard/ForbiddenUpgradePrompt";
import { SuggestedOutfitItems } from "../../components/dashboard/SuggestedOutfitItems";
import { dashboardCopy } from "../../content/dashboardCopy";
import { invalidateResourceQueries } from "../../hooks/resourceQueryCache";
import {
  getAppWardrobeRecommendationsPath,
} from "../../routes/paths";

export type RecommendationDetailPageProps = {
  resourceApi?: ResourceApi;
  wardrobeId?: string;
};

export const RecommendationDetailPage = ({
  resourceApi: resourceApiProp,
  wardrobeId: wardrobeIdProp,
}: RecommendationDetailPageProps) => {
  const { id: wardrobeIdFromParams } = useParams();
  const wardrobeId = wardrobeIdProp ?? wardrobeIdFromParams ?? "";
  const location = useLocation();
  const suggestedOutfit = readSuggestedOutfitState(location.state);
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const copy = dashboardCopy.recommendations;
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [upgradeKind, setUpgradeKind] = useState<
    ReturnType<typeof getForbiddenUpgradeKind>
  >(undefined);

  if (!suggestedOutfit) {
    return (
      <Navigate to={getAppWardrobeRecommendationsPath(wardrobeId)} replace />
    );
  }

  const title = getRecommendationTitle(suggestedOutfit.recommendation);
  const reason = getRecommendationReason(suggestedOutfit.recommendation);
  const listPath = getAppWardrobeRecommendationsPath(wardrobeId);

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(undefined);
    setSaveSuccess(false);
    try {
      await resourceApi.createOutfit(
        wardrobeId,
        toCreateOutfitRequest(suggestedOutfit.recommendation),
      );
      invalidateResourceQueries(["outfits"]);
      setSaveSuccess(true);
    } catch (error) {
      const nextUpgrade = getForbiddenUpgradeKind(error);
      if (nextUpgrade) {
        setUpgradeKind(nextUpgrade);
        return;
      }

      setSaveError(
        isApiError(error) ? error.message : copy.saveErrorDescription,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    void handleSave();
  };

  const backLink = (
    <Button
      component={RouterLink}
      to={listPath}
      variant="text"
      color="secondary"
      tabIndex={0}
      aria-label={copy.backToListAriaLabel}
    >
      {copy.backToListLabel}
    </Button>
  );

  if (upgradeKind) {
    return (
      <DashboardPage
        headingId="suggested-outfit-detail-heading"
        title={title}
        description={reason ?? copy.detailDescription}
        actions={backLink}
      >
        <ForbiddenUpgradePrompt kind={upgradeKind} />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      headingId="suggested-outfit-detail-heading"
      title={title}
      description={reason ?? copy.detailDescription}
      actions={backLink}
    >
      <Stack spacing={3}>
        {saveError ? (
          <Alert severity="error" role="alert">
            {`${copy.saveErrorTitle}. ${saveError}`}
          </Alert>
        ) : null}
        {saveSuccess ? (
          <Alert severity="success" role="status">
            {copy.saveSuccess}
          </Alert>
        ) : null}
        <SuggestedOutfitItems
          items={suggestedOutfit.items}
          label={`Items in ${title}`}
        />
        <Button
          type="button"
          variant="contained"
          color="primary"
          tabIndex={0}
          aria-label={isSaving ? copy.savingLabel : copy.saveAriaLabel}
          disabled={isSaving}
          onClick={handleSaveClick}
        >
          {isSaving ? copy.savingLabel : copy.saveLabel}
        </Button>
      </Stack>
    </DashboardPage>
  );
};
