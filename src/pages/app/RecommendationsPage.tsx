import type { KeyboardEvent } from "react";
import { useMemo } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  canUseAiTryOn,
  canUseOtherAi,
  getCatalogKindForLimitCode,
  getForbiddenUpgradeKind,
} from "../../api/entitlementGating";
import {
  getRecommendationReason,
  getRecommendationTitle,
  parseOutfitRecommendations,
  toSuggestedOutfitLocationState,
  toSuggestedOutfitView,
  type SuggestedOutfitView,
} from "../../api/outfitRecommendations";
import { isNotFoundError, type ResourceApi } from "../../api/resourceApi";
import type {
  ClothingItem,
  Entitlement,
  OutfitRecommendation,
  Wardrobe,
} from "../../api/resourceTypes";
import { useResourceApi } from "../../api/useResourceApi";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ForbiddenUpgradePrompt } from "../../components/dashboard/ForbiddenUpgradePrompt";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { SuggestedOutfitItems } from "../../components/dashboard/SuggestedOutfitItems";
import { dashboardCopy } from "../../content/dashboardCopy";
import { useAbortableResourceQuery } from "../../hooks/useAbortableResourceQuery";
import {
  getAppWardrobePath,
  getAppWardrobeRecommendationDetailPath,
} from "../../routes/paths";

export type RecommendationsPageProps = {
  resourceApi?: ResourceApi;
  wardrobeId?: string;
};

type RecommendationsPageData = {
  entitlement: Entitlement;
  wardrobe: Wardrobe;
  items: ClothingItem[];
  recommendations: OutfitRecommendation[];
};

const loadRecommendationsPage = async (
  resourceApi: ResourceApi,
  wardrobeId: string,
  signal: AbortSignal,
): Promise<RecommendationsPageData> => {
  const [entitlement, detail] = await Promise.all([
    resourceApi.getMe(),
    resourceApi.getWardrobeDetail(wardrobeId),
  ]);

  if (!canUseAiTryOn(entitlement) && !canUseOtherAi(entitlement)) {
    return {
      entitlement,
      wardrobe: detail.wardrobe,
      items: detail.items,
      recommendations: [],
    };
  }

  const recommendationList = await resourceApi.listRecommendations(
    wardrobeId,
    { signal },
  );

  return {
    entitlement,
    wardrobe: detail.wardrobe,
    items: detail.items,
    recommendations: parseOutfitRecommendations(recommendationList),
  };
};

export const RecommendationsPage = ({
  resourceApi: resourceApiProp,
  wardrobeId: wardrobeIdProp,
}: RecommendationsPageProps) => {
  const { id: wardrobeIdFromParams } = useParams();
  const wardrobeId = wardrobeIdProp ?? wardrobeIdFromParams ?? "";
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const copy = dashboardCopy.recommendations;
  const loadPage = useMemo(
    () => (signal: AbortSignal) =>
      loadRecommendationsPage(resourceApi, wardrobeId, signal),
    [resourceApi, wardrobeId],
  );
  const query = useAbortableResourceQuery(
    `recommendations:${wardrobeId}`,
    loadPage,
  );

  const backLink = (
    <Button
      component={RouterLink}
      to={getAppWardrobePath(wardrobeId)}
      variant="text"
      color="secondary"
      tabIndex={0}
      aria-label={copy.backAriaLabel}
    >
      {copy.backLabel}
    </Button>
  );

  const refreshAction = (
    <Button
      type="button"
      variant="outlined"
      color="secondary"
      tabIndex={0}
      aria-label={copy.refreshAriaLabel}
      onClick={query.handleRetry}
    >
      {copy.refreshLabel}
    </Button>
  );

  const pageActions = (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
      {backLink}
      {refreshAction}
    </Stack>
  );

  if (wardrobeId.trim().length === 0) {
    return (
      <DashboardPage
        headingId="suggested-outfits-heading"
        title={copy.notFoundTitle}
        description={copy.notFoundDescription}
      >
        <ResourceEmptyState
          title={copy.notFoundTitle}
          description={copy.notFoundDescription}
        />
      </DashboardPage>
    );
  }

  if (query.status === "loading") {
    return (
      <DashboardPage
        headingId="suggested-outfits-heading"
        title={copy.title}
        description={copy.description}
        actions={backLink}
      >
        <ResourceLoadingState label={copy.loadingLabel} />
      </DashboardPage>
    );
  }

  if (query.status === "error") {
    const upgradeKind = getForbiddenUpgradeKind(query.error);
    if (upgradeKind) {
      return (
        <DashboardPage
          headingId="suggested-outfits-heading"
          title={copy.title}
          description={copy.description}
          actions={backLink}
        >
          <ForbiddenUpgradePrompt
            kind={upgradeKind}
            catalogKind={getCatalogKindForLimitCode(query.error.code)}
          />
        </DashboardPage>
      );
    }

    if (isNotFoundError(query.error)) {
      return (
        <DashboardPage
          headingId="suggested-outfits-heading"
          title={copy.notFoundTitle}
          description={copy.notFoundDescription}
          actions={backLink}
        >
          <ResourceEmptyState
            title={copy.notFoundTitle}
            description={copy.notFoundDescription}
          />
        </DashboardPage>
      );
    }

    return (
      <DashboardPage
        headingId="suggested-outfits-heading"
        title={copy.title}
        description={copy.description}
        actions={pageActions}
      >
        <ResourceErrorState
          title={copy.errorTitle}
          description={copy.errorDescription}
          retryLabel={copy.retryLabel}
          onRetry={query.handleRetry}
        />
      </DashboardPage>
    );
  }

  if (!canUseAiTryOn(query.data.entitlement) && !canUseOtherAi(query.data.entitlement)) {
    return (
      <DashboardPage
        headingId="suggested-outfits-heading"
        title={copy.title}
        description={copy.description}
        actions={backLink}
      >
        <ForbiddenUpgradePrompt
          kind="premium"
          entitlement={query.data.entitlement}
        />
      </DashboardPage>
    );
  }

  const views = query.data.recommendations.map((recommendation) =>
    toSuggestedOutfitView(recommendation, query.data.items),
  );

  if (views.length === 0) {
    return (
      <DashboardPage
        headingId="suggested-outfits-heading"
        title={copy.title}
        description={copy.description}
        actions={pageActions}
      >
        <ResourceEmptyState
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      headingId="suggested-outfits-heading"
      title={copy.title}
      description={copy.description}
      actions={pageActions}
    >
      <RecommendationsReady wardrobeId={query.data.wardrobe.wardrobeId} views={views} />
    </DashboardPage>
  );
};

type RecommendationsReadyProps = {
  wardrobeId: string;
  views: SuggestedOutfitView[];
};

const RecommendationsReady = ({
  wardrobeId,
  views,
}: RecommendationsReadyProps) => {
  const copy = dashboardCopy.recommendations;
  const navigate = useNavigate();

  const handleOpenSuggestion = (view: SuggestedOutfitView) => {
    navigate(getAppWardrobeRecommendationDetailPath(wardrobeId), {
      state: toSuggestedOutfitLocationState(view),
    });
  };

  return (
    <Stack spacing={3} component="section" aria-label={copy.listLabel}>
      {views.map((view, index) => {
        const title = getRecommendationTitle(view.recommendation);
        const reason = getRecommendationReason(view.recommendation);
        const titleId = `suggested-outfit-${index}-title`;
        const handleClick = () => {
          handleOpenSuggestion(view);
        };
        const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }

          event.preventDefault();
          handleOpenSuggestion(view);
        };

        return (
          <Paper
            key={`${title}-${view.items.map((item) => item.itemId).join("-")}`}
            component="article"
            elevation={0}
            role="link"
            tabIndex={0}
            aria-label={title}
            aria-labelledby={titleId}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            sx={{
              p: 2,
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              cursor: "pointer",
              "&:hover": {
                borderColor: "primary.light",
              },
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: "primary.main",
                outlineOffset: 2,
              },
            }}
          >
            <Stack spacing={2}>
              <Box>
                <Typography id={titleId} variant="h3" component="h2">
                  {title}
                </Typography>
                {reason ? (
                  <Typography variant="body2" color="text.secondary">
                    {reason}
                  </Typography>
                ) : null}
              </Box>
              <SuggestedOutfitItems
                items={view.items}
                label={`Items in ${title}`}
              />
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
};
