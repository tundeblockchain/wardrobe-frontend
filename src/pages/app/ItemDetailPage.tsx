import { useMemo } from "react";
import CheckroomOutlined from "@mui/icons-material/CheckroomOutlined";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useParams, useSearchParams } from "react-router-dom";
import { isNotFoundError, type ResourceApi } from "../../api/resourceApi";
import {
  getClothingCategoryLabel,
  getColourLabel,
  getItemImageUrl,
  getProcessingStatusLabel,
} from "../../api/resourceDisplay";
import type { ClothingItem } from "../../api/resourceTypes";
import { useResourceApi } from "../../api/useResourceApi";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceImage } from "../../components/dashboard/ResourceImage";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { dashboardCopy } from "../../content/dashboardCopy";
import { useResourceQuery } from "../../hooks/useResourceQuery";
import {
  getAppWardrobePath,
  WARDROBE_ID_QUERY_PARAM,
} from "../../routes/paths";

export type ItemDetailPageProps = {
  resourceApi?: ResourceApi;
  itemId?: string;
  wardrobeId?: string;
};

const getItemMetaChips = (item: ClothingItem): string[] => {
  const chips = [getClothingCategoryLabel(item.category)];
  if (item.subcategory) {
    chips.push(getColourLabel(item.subcategory));
  }
  if (item.colours) {
    chips.push(...item.colours.map(getColourLabel));
  }
  if (item.processingStatus !== "READY") {
    chips.push(getProcessingStatusLabel(item.processingStatus));
  }
  return chips;
};

export const ItemDetailPage = ({
  resourceApi: resourceApiProp,
  itemId: itemIdProp,
  wardrobeId: wardrobeIdProp,
}: ItemDetailPageProps) => {
  const { id: itemIdFromParams } = useParams();
  const [searchParams] = useSearchParams();
  const itemId = itemIdProp ?? itemIdFromParams ?? "";
  const wardrobeId =
    wardrobeIdProp ?? searchParams.get(WARDROBE_ID_QUERY_PARAM) ?? undefined;
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const copy = dashboardCopy.itemDetail;
  const queryKey = `item:${itemId}:${wardrobeId ?? ""}`;
  const loadItem = useMemo(
    () => () => resourceApi.getItem(itemId, wardrobeId),
    [itemId, resourceApi, wardrobeId],
  );
  const query = useResourceQuery(queryKey, loadItem);

  const backToWardrobePath = wardrobeId
    ? getAppWardrobePath(wardrobeId)
    : undefined;

  const backLink = backToWardrobePath ? (
    <Button
      component={RouterLink}
      to={backToWardrobePath}
      variant="text"
      color="secondary"
      tabIndex={0}
      aria-label="Back to wardrobe"
    >
      Back to wardrobe
    </Button>
  ) : null;

  if (query.status === "loading") {
    return (
      <DashboardPage
        headingId="item-detail-heading"
        title={copy.fallbackTitle}
        description={copy.description}
        actions={backLink}
      >
        <ResourceLoadingState label={copy.loadingLabel} />
      </DashboardPage>
    );
  }

  if (query.status === "error") {
    if (isNotFoundError(query.error) || itemId.trim().length === 0) {
      return (
        <DashboardPage
          headingId="item-detail-heading"
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
        headingId="item-detail-heading"
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

  const item = query.data;
  const chips = getItemMetaChips(item);
  const wardrobePath = getAppWardrobePath(item.wardrobeId);

  return (
    <DashboardPage
      headingId="item-detail-heading"
      title={item.name}
      description={copy.description}
      actions={
        <Button
          component={RouterLink}
          to={wardrobePath}
          variant="text"
          color="secondary"
          tabIndex={0}
          aria-label="Back to wardrobe"
        >
          Back to wardrobe
        </Button>
      }
    >
      <Paper
        component="article"
        elevation={0}
        aria-labelledby="item-detail-heading"
        sx={{
          overflow: "hidden",
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 2fr) minmax(0, 3fr)" },
          }}
        >
          <Box sx={{ minHeight: { xs: 280, md: 420 } }}>
            <ResourceImage
              imageUrl={getItemImageUrl(item)}
              alt={item.name}
              fallbackLabel="No photo for this item"
              FallbackIcon={CheckroomOutlined}
            />
          </Box>
          <Stack spacing={2} sx={{ p: { xs: 2.5, md: 4 } }}>
            {chips.length > 0 ? (
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ flexWrap: "wrap" }}
              >
                {chips.map((chip) => (
                  <Chip
                    key={chip}
                    label={chip}
                    size="small"
                    color="secondary"
                    sx={{ fontWeight: 600 }}
                  />
                ))}
              </Stack>
            ) : null}
            {item.brand ? (
              <Typography variant="body1">{item.brand}</Typography>
            ) : null}
            {item.acquiredAt ? (
              <Typography variant="body2" color="text.secondary">
                Added {item.acquiredAt}
              </Typography>
            ) : null}
            {item.processingError ? (
              <Typography variant="body2" color="text.secondary">
                {item.processingError}
              </Typography>
            ) : null}
          </Stack>
        </Box>
      </Paper>
    </DashboardPage>
  );
};
