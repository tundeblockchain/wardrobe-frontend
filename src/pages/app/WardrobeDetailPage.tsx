import { useMemo, useState } from "react";
import CheckroomOutlined from "@mui/icons-material/CheckroomOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { isApiError } from "../../api/httpClient";
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
import { invalidateCatalogLists } from "../../hooks/resourceQueryCache";
import { useResourceQuery } from "../../hooks/useResourceQuery";
import {
  appPaths,
  getAppItemNewPath,
  getAppItemPath,
  getAppWardrobeEditPath,
  getAppWardrobeRecommendationsPath,
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
  const navigate = useNavigate();
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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  const handleOpenDelete = () => {
    setDeleteError(undefined);
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    if (isDeleting) {
      return;
    }

    setIsDeleteOpen(false);
  };

  const handleConfirmDelete = async (id: string) => {
    setIsDeleting(true);
    setDeleteError(undefined);
    try {
      await resourceApi.deleteWardrobe(id);
      invalidateCatalogLists();
      navigate(appPaths.app);
    } catch (error) {
      const serverMessage = isApiError(error) ? error.message.trim() : "";
      setDeleteError(serverMessage || copy.deleteErrorFallback);
    } finally {
      setIsDeleting(false);
    }
  };

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

  const deleteDialog = (id: string) => (
    <Dialog
      open={isDeleteOpen}
      onClose={handleCloseDelete}
      aria-labelledby="delete-wardrobe-title"
      aria-describedby="delete-wardrobe-description"
    >
      <DialogTitle id="delete-wardrobe-title">
        {copy.deleteConfirmTitle}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography id="delete-wardrobe-description" variant="body2">
            {copy.deleteConfirmDescription}
          </Typography>
          {deleteError ? (
            <Typography variant="body2" color="error" role="alert">
              {deleteError}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          type="button"
          onClick={handleCloseDelete}
          color="secondary"
          tabIndex={0}
          aria-label="Cancel"
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => {
            void handleConfirmDelete(id);
          }}
          color="error"
          variant="contained"
          tabIndex={0}
          aria-label={copy.deleteConfirmLabel}
          disabled={isDeleting}
        >
          {copy.deleteConfirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
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
        type="button"
        variant="outlined"
        color="error"
        tabIndex={0}
        aria-label={copy.deleteAriaLabel}
        onClick={handleOpenDelete}
      >
        {copy.deleteLabel}
      </Button>
      <Button
        component={RouterLink}
        to={getAppWardrobeRecommendationsPath(id)}
        variant="outlined"
        color="secondary"
        tabIndex={0}
        aria-label={copy.suggestedOutfitsAriaLabel}
      >
        {copy.suggestedOutfitsLabel}
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
        {deleteDialog(wardrobe.wardrobeId)}
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
      {deleteDialog(wardrobe.wardrobeId)}
    </DashboardPage>
  );
};
