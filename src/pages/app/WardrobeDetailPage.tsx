import { useMemo } from "react";
import CheckroomOutlined from "@mui/icons-material/CheckroomOutlined";
import { Box, Button, Stack } from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";
import { isNotFoundError, type ResourceApi } from "../../api/resourceApi";
import {
  getClothingCategoryLabel,
  getItemImageUrl,
} from "../../api/resourceDisplay";
import { useResourceApi } from "../../api/useResourceApi";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ResourceCard } from "../../components/dashboard/ResourceCard";
import { ResourceCardGrid } from "../../components/dashboard/ResourceCardGrid";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { dashboardCopy } from "../../content/dashboardCopy";
import { useResourceQuery } from "../../hooks/useResourceQuery";
import {
  appPaths,
  getAppItemNewPath,
  getAppItemPath,
  getAppWardrobeEditPath,
} from "../../routes/paths";

export type WardrobeDetailPageProps = {
  resourceApi?: ResourceApi;
  wardrobeId?: string;
};

export const WardrobeDetailPage = ({
  resourceApi: resourceApiProp,
  wardrobeId: wardrobeIdProp,
}: WardrobeDetailPageProps) => {
  const { id: wardrobeIdFromParams } = useParams();
  const wardrobeId = wardrobeIdProp ?? wardrobeIdFromParams ?? "";
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const copy = dashboardCopy.wardrobeDetail;
  const loadWardrobeDetail = useMemo(
    () => () => resourceApi.getWardrobeDetail(wardrobeId),
    [resourceApi, wardrobeId],
  );
  const query = useResourceQuery(
    `wardrobe:${wardrobeId}`,
    loadWardrobeDetail,
  );

  const backLink = (
    <Button
      component={RouterLink}
      to={appPaths.appWardrobes}
      variant="text"
      color="secondary"
      tabIndex={0}
      aria-label="Back to wardrobes"
    >
      Back to wardrobes
    </Button>
  );

  const wardrobeActions = (id: string) => (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
      {backLink}
      <Button
        component={RouterLink}
        to={getAppWardrobeEditPath(id)}
        variant="outlined"
        color="secondary"
        tabIndex={0}
        aria-label={copy.editAriaLabel}
      >
        {copy.editLabel}
      </Button>
      <Button
        component={RouterLink}
        to={getAppItemNewPath(id)}
        variant="contained"
        color="primary"
        tabIndex={0}
        aria-label={copy.addItemAriaLabel}
      >
        {copy.addItemLabel}
      </Button>
    </Stack>
  );

  if (query.status === "loading") {
    return (
      <DashboardPage
        headingId="wardrobe-detail-heading"
        title={copy.fallbackTitle}
        description={copy.description}
        actions={backLink}
      >
        <ResourceLoadingState label={copy.loadingLabel} />
      </DashboardPage>
    );
  }

  if (query.status === "error") {
    if (isNotFoundError(query.error) || wardrobeId.trim().length === 0) {
      return (
        <DashboardPage
          headingId="wardrobe-detail-heading"
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
        headingId="wardrobe-detail-heading"
        title={copy.fallbackTitle}
        description={copy.description}
        actions={backLink}
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

  const { wardrobe, items } = query.data;

  if (items.length === 0) {
    return (
      <DashboardPage
        headingId="wardrobe-detail-heading"
        title={wardrobe.name}
        description={copy.description}
        actions={wardrobeActions(wardrobe.wardrobeId)}
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
      headingId="wardrobe-detail-heading"
      title={wardrobe.name}
      description={copy.description}
      actions={wardrobeActions(wardrobe.wardrobeId)}
    >
      <ResourceCardGrid label={`Clothing items in ${wardrobe.name}`}>
        {items.map((item) => {
          const titleId = `item-${item.itemId}-title`;
          return (
            <Box key={item.itemId} component="li" sx={{ minWidth: 0 }}>
              <ResourceCard
                to={getAppItemPath(item.itemId, item.wardrobeId)}
                title={item.name}
                titleId={titleId}
                imageUrl={getItemImageUrl(item)}
                imageAlt={item.name}
                fallbackLabel="No photo for this item"
                FallbackIcon={CheckroomOutlined}
                chips={[getClothingCategoryLabel(item.category)]}
                description={item.brand}
              />
            </Box>
          );
        })}
      </ResourceCardGrid>
    </DashboardPage>
  );
};
