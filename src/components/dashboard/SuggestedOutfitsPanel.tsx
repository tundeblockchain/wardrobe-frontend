import { useMemo, useState, type ChangeEvent } from "react";
import {
  Alert,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  canUseOutfitSuggestions,
  getCatalogKindForLimitCode,
  getForbiddenUpgradeKind,
  getRecommendationsPaywallKind,
} from "../../api/entitlementGating";
import { isApiError } from "../../api/httpClient";
import { loadOutfitRecommendations } from "../../api/loadOutfitRecommendations";
import {
  DEFAULT_SUGGESTED_OUTFIT_NAME,
  getRecommendationTitle,
  toCreateOutfitRequest,
  toSuggestedOutfitView,
  type SuggestedOutfitView,
} from "../../api/outfitRecommendations";
import type { ResourceApi } from "../../api/resourceApi";
import type { Entitlement, Wardrobe } from "../../api/resourceTypes";
import { dashboardCopy } from "../../content/dashboardCopy";
import { invalidateResourceQueries } from "../../hooks/resourceQueryCache";
import { useAbortableResourceQuery } from "../../hooks/useAbortableResourceQuery";
import { useResourceQuery } from "../../hooks/useResourceQuery";
import { DashboardNarrowContent } from "./DashboardNarrowContent";
import { ForbiddenUpgradePrompt } from "./ForbiddenUpgradePrompt";
import { SuggestedOutfitsPaywall } from "./SuggestedOutfitsPaywall";
import { ResourceCardGrid } from "./ResourceCardGrid";
import { ResourceEmptyState } from "./ResourceEmptyState";
import { ResourceLoadingState } from "./ResourceLoadingState";
import { SuggestedOutfitCard } from "./SuggestedOutfitCard";
import { SuggestedOutfitSaveForm } from "./SuggestedOutfitSaveForm";

export type SuggestedOutfitsPanelProps = {
  resourceApi: ResourceApi;
  wardrobeId: string;
  wardrobes?: Wardrobe[];
  onWardrobeChange?: (wardrobeId: string) => void;
};

export const SuggestedOutfitsEmptyPanel = () => {
  const copy = dashboardCopy.recommendations;

  return (
    <DashboardNarrowContent>
      <Stack
        spacing={2}
        component="section"
        aria-label={copy.listLabel}
        sx={{ width: "100%", minWidth: 0 }}
      >
        <Typography variant="h2" component="h2">
          {copy.title}
        </Typography>
        <ResourceEmptyState
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      </Stack>
    </DashboardNarrowContent>
  );
};

export const SuggestedOutfitsPanel = ({
  resourceApi,
  wardrobeId,
  wardrobes = [],
  onWardrobeChange,
}: SuggestedOutfitsPanelProps) => {
  const copy = dashboardCopy.recommendations;
  const loadSuggestions = useMemo(
    () => (signal: AbortSignal) =>
      loadOutfitRecommendations(resourceApi, wardrobeId, signal),
    [resourceApi, wardrobeId],
  );
  const query = useAbortableResourceQuery(
    `recommendations:${wardrobeId}`,
    loadSuggestions,
  );
  const meQuery = useResourceQuery("me", resourceApi.getMe);
  const entitlement =
    query.status === "ready"
      ? query.data.entitlement
      : meQuery.status === "ready"
        ? meQuery.data
        : undefined;
  const [selectedView, setSelectedView] = useState<
    SuggestedOutfitView | undefined
  >(undefined);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveUpgradeKind, setSaveUpgradeKind] = useState<
    ReturnType<typeof getForbiddenUpgradeKind>
  >(undefined);
  const [saveUpgradeCode, setSaveUpgradeCode] = useState<string | undefined>();

  const handleWardrobeChange = (event: ChangeEvent<HTMLInputElement>) => {
    onWardrobeChange?.(event.target.value);
    setSelectedView(undefined);
    setSaveError(undefined);
    setSaveSuccess(false);
    setSaveUpgradeKind(undefined);
    setSaveUpgradeCode(undefined);
  };

  const handleRetry = () => {
    query.handleRetry();
  };

  const handleSaveOpen = (view: SuggestedOutfitView) => {
    const title = getRecommendationTitle(view.recommendation);
    setSelectedView(view);
    setName(title === DEFAULT_SUGGESTED_OUTFIT_NAME ? "" : title);
    setSaveError(undefined);
    setSaveSuccess(false);
    setSaveUpgradeKind(undefined);
    setSaveUpgradeCode(undefined);
  };

  const handleSaveCancel = () => {
    setSelectedView(undefined);
    setSaveError(undefined);
    setIsSaving(false);
  };

  const handleNameChange = (nextName: string) => {
    setName(nextName);
  };

  const handleSave = async () => {
    if (!selectedView || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(undefined);
    try {
      await resourceApi.createOutfit(
        wardrobeId,
        toCreateOutfitRequest(selectedView.recommendation, name),
      );
      invalidateResourceQueries(["outfits"]);
      setSaveSuccess(true);
      setSelectedView(undefined);
    } catch (error) {
      const nextUpgrade = getForbiddenUpgradeKind(error);
      if (nextUpgrade) {
        setSaveUpgradeKind(nextUpgrade);
        setSaveUpgradeCode(isApiError(error) ? error.code : undefined);
        return;
      }

      setSaveError(
        isApiError(error) ? error.message : copy.saveErrorDescription,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSubmit = () => {
    void handleSave();
  };

  const handleSaveRetry = () => {
    void handleSave();
  };

  const toolbar = (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      useFlexGap
      sx={{ flexWrap: "wrap", alignItems: { sm: "center" } }}
    >
      {wardrobes.length > 1 && onWardrobeChange ? (
        <TextField
          id="suggested-outfits-wardrobe"
          name="wardrobeId"
          label={dashboardCopy.outfitForm.wardrobeLabel}
          value={wardrobeId}
          onChange={handleWardrobeChange}
          select
          size="small"
          sx={{ minWidth: { xs: "100%", sm: 220 } }}
          slotProps={{
            htmlInput: {
              "aria-label": dashboardCopy.outfitForm.wardrobeLabel,
            },
          }}
        >
          {wardrobes.map((wardrobe) => (
            <MenuItem key={wardrobe.wardrobeId} value={wardrobe.wardrobeId}>
              {wardrobe.name}
            </MenuItem>
          ))}
        </TextField>
      ) : null}
      <Button
        type="button"
        variant="outlined"
        color="secondary"
        tabIndex={0}
        aria-label={copy.refreshAriaLabel}
        onClick={handleRetry}
      >
        {copy.refreshLabel}
      </Button>
    </Stack>
  );

  return (
    <Stack spacing={2} component="section" aria-label={copy.listLabel}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{
          alignItems: { sm: "flex-start" },
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h2" component="h2">
          {copy.title}
        </Typography>
        {toolbar}
      </Stack>
      {saveSuccess ? (
        <Alert severity="success" role="status">
          {copy.saveSuccess}
        </Alert>
      ) : null}
      <SuggestedOutfitsPanelBody
        query={query}
        entitlement={entitlement}
        selectedView={selectedView}
        name={name}
        isSaving={isSaving}
        saveError={saveError}
        saveUpgradeKind={saveUpgradeKind}
        saveUpgradeCode={saveUpgradeCode}
        onSaveOpen={handleSaveOpen}
        onNameChange={handleNameChange}
        onSaveCancel={handleSaveCancel}
        onSaveSubmit={handleSaveSubmit}
        onSaveRetry={handleSaveRetry}
        onRetry={handleRetry}
      />
    </Stack>
  );
};

type SuggestedOutfitsPanelBodyProps = {
  query: ReturnType<typeof useAbortableResourceQuery<
    Awaited<ReturnType<typeof loadOutfitRecommendations>>
  >>;
  entitlement?: Entitlement;
  selectedView?: SuggestedOutfitView;
  name: string;
  isSaving: boolean;
  saveError?: string;
  saveUpgradeKind: ReturnType<typeof getForbiddenUpgradeKind>;
  saveUpgradeCode?: string;
  onSaveOpen: (view: SuggestedOutfitView) => void;
  onNameChange: (name: string) => void;
  onSaveCancel: () => void;
  onSaveSubmit: () => void;
  onSaveRetry: () => void;
  onRetry: () => void;
};

const SuggestedOutfitsPanelBody = ({
  query,
  entitlement,
  selectedView,
  name,
  isSaving,
  saveError,
  saveUpgradeKind,
  saveUpgradeCode,
  onSaveOpen,
  onNameChange,
  onSaveCancel,
  onSaveSubmit,
  onSaveRetry,
  onRetry,
}: SuggestedOutfitsPanelBodyProps) => {
  const copy = dashboardCopy.recommendations;

  if (query.status === "loading") {
    return <ResourceLoadingState label={copy.loadingLabel} />;
  }

  if (query.status === "error") {
    const paywallKind = getRecommendationsPaywallKind(query.error);
    if (paywallKind) {
      return <SuggestedOutfitsPaywall entitlement={entitlement} />;
    }

    return (
      <SuggestionErrorState
        message={query.error.message || copy.errorDescription}
        onRetry={onRetry}
      />
    );
  }

  if (!canUseOutfitSuggestions(query.data.entitlement)) {
    return (
      <SuggestedOutfitsPaywall entitlement={query.data.entitlement} />
    );
  }

  if (saveUpgradeKind) {
    return (
      <ForbiddenUpgradePrompt
        kind={saveUpgradeKind}
        catalogKind={getCatalogKindForLimitCode(saveUpgradeCode)}
        entitlement={query.data.entitlement}
      />
    );
  }

  if (selectedView) {
    return (
      <Stack spacing={2}>
        <SuggestedOutfitSaveForm
          view={selectedView}
          name={name}
          isSaving={isSaving}
          saveError={saveError}
          onNameChange={onNameChange}
          onCancel={onSaveCancel}
          onSubmit={onSaveSubmit}
        />
        {saveError ? (
          <Button
            type="button"
            variant="outlined"
            color="primary"
            tabIndex={0}
            aria-label={copy.retryButtonLabel}
            disabled={isSaving}
            onClick={onSaveRetry}
          >
            {copy.retryButtonLabel}
          </Button>
        ) : null}
      </Stack>
    );
  }

  const views = query.data.recommendations.map((recommendation) =>
    toSuggestedOutfitView(recommendation, query.data.items),
  );

  if (views.length === 0) {
    return (
      <ResourceEmptyState
        title={copy.emptyTitle}
        description={copy.emptyDescription}
      />
    );
  }

  return (
    <ResourceCardGrid label={copy.listLabel}>
      {views.map((view, index) => (
        <SuggestedOutfitCard
          key={`${getRecommendationTitle(view.recommendation)}-${view.items
            .map((item) => item.itemId)
            .join("-")}`}
          view={view}
          index={index}
          onSave={onSaveOpen}
        />
      ))}
    </ResourceCardGrid>
  );
};

type SuggestionErrorStateProps = {
  message: string;
  onRetry: () => void;
};

const SuggestionErrorState = ({
  message,
  onRetry,
}: SuggestionErrorStateProps) => {
  const copy = dashboardCopy.recommendations;
  const handleRetryClick = () => {
    onRetry();
  };

  return (
    <Stack spacing={2}>
      <Alert severity="error" role="alert">
        {`${copy.errorTitle}. ${message}`}
      </Alert>
      <Button
        type="button"
        variant="outlined"
        color="primary"
        tabIndex={0}
        aria-label={copy.retryButtonLabel}
        onClick={handleRetryClick}
      >
        {copy.retryButtonLabel}
      </Button>
    </Stack>
  );
};
