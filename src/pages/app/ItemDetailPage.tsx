import { useMemo, useState, type ReactNode } from "react";
import CheckroomOutlined from "@mui/icons-material/CheckroomOutlined";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  Link as RouterLink,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  canUseAiTryOn,
  getForbiddenUpgradeKind,
  type ForbiddenUpgradeKind,
} from "../../api/entitlementGating";
import { isApiError } from "../../api/httpClient";
import { mapRenderImageUrls } from "../../api/renderImages";
import {
  getClothingCategoryLabel,
  getColourLabel,
  getColourSwatchHex,
  getItemDisplayName,
  getItemImageUrl,
  getProcessingStatusLabel,
} from "../../api/resourceDisplay";
import { isNotFoundError, type ResourceApi } from "../../api/resourceApi";
import type { ClothingItem, Entitlement, Outfit, Wardrobe } from "../../api/resourceTypes";
import { useResourceApi } from "../../api/useResourceApi";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ForbiddenUpgradePrompt } from "../../components/dashboard/ForbiddenUpgradePrompt";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceImage } from "../../components/dashboard/ResourceImage";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { dashboardCopy } from "../../content/dashboardCopy";
import { useResourceQuery } from "../../hooks/useResourceQuery";
import {
  appPaths,
  getAppItemEditPath,
  getAppOutfitEditPath,
  getAppWardrobePath,
  WARDROBE_ID_QUERY_PARAM,
} from "../../routes/paths";

export type ItemDetailPageProps = {
  resourceApi?: ResourceApi;
  itemId?: string;
  wardrobeId?: string;
};

type ItemDetailData = {
  item: ClothingItem;
  wardrobe?: Wardrobe;
  outfits: Outfit[];
  entitlement?: Entitlement;
  entitlementError?: unknown;
};

type ItemDetailRowProps = {
  label: string;
  value?: string;
  children?: ReactNode;
};

const readOptionalText = (value?: string | null): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed;
};

const ItemDetailRow = ({ label, value, children }: ItemDetailRowProps) => {
  return (
    <Stack spacing={0.75} role="group" aria-label={label}>
      <Typography
        variant="overline"
        component="h2"
        sx={{ letterSpacing: "0.08em", color: "text.secondary" }}
      >
        {label}
      </Typography>
      {children ?? (
        <Typography variant="body1">
          {readOptionalText(value) ?? dashboardCopy.itemDetail.notSetLabel}
        </Typography>
      )}
    </Stack>
  );
};

const ItemDetailPhoto = ({
  imageUrl,
  alt,
}: {
  imageUrl?: string;
  alt: string;
}) => {
  const [hasImageError, setHasImageError] = useState(false);

  const handleImageError = () => {
    setHasImageError(true);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        boxShadow: 3,
        overflow: "hidden",
        bgcolor: "background.paper",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: { xs: 280, md: 420 },
        height: "100%",
        p: 2,
      }}
    >
      {!imageUrl || hasImageError ? (
        <Stack
          spacing={1}
          sx={{ alignItems: "center", color: "text.secondary", px: 2 }}
          aria-label={`${alt} photo not available`}
        >
          <CheckroomOutlined aria-hidden="true" sx={{ fontSize: 40 }} />
          <Typography variant="body2" sx={{ textAlign: "center" }}>
            {dashboardCopy.itemDetail.photoFallback}
          </Typography>
        </Stack>
      ) : (
        <Box
          component="img"
          src={imageUrl}
          alt={alt}
          onError={handleImageError}
          sx={{
            display: "block",
            width: "100%",
            height: "100%",
            maxHeight: { xs: 360, md: 520 },
            objectFit: "contain",
          }}
        />
      )}
    </Paper>
  );
};

const loadItemDetail = async (
  resourceApi: ResourceApi,
  itemId: string,
): Promise<ItemDetailData> => {
  const item = await resourceApi.getItem(itemId);
  const [wardrobeResult, outfitsResult, meResult] = await Promise.allSettled([
    resourceApi.getWardrobe(item.wardrobeId),
    resourceApi.listOutfits(),
    resourceApi.getMe(),
  ]);

  return {
    item,
    wardrobe:
      wardrobeResult.status === "fulfilled" ? wardrobeResult.value : undefined,
    outfits:
      outfitsResult.status === "fulfilled"
        ? outfitsResult.value.outfits.filter((outfit) =>
            outfit.items.some((entry) => entry.itemId === item.itemId),
          )
        : [],
    entitlement: meResult.status === "fulfilled" ? meResult.value : undefined,
    entitlementError:
      meResult.status === "rejected" ? meResult.reason : undefined,
  };
};

export const ItemDetailPage = ({
  resourceApi: resourceApiProp,
  itemId: itemIdProp,
  wardrobeId: wardrobeIdProp,
}: ItemDetailPageProps) => {
  const { id: itemIdFromParams } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const itemId = itemIdProp ?? itemIdFromParams ?? "";
  const wardrobeId =
    wardrobeIdProp ?? searchParams.get(WARDROBE_ID_QUERY_PARAM) ?? undefined;
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const copy = dashboardCopy.itemDetail;
  const queryKey = `item:${itemId}`;
  const loadItem = useMemo(
    () => () => loadItemDetail(resourceApi, itemId),
    [itemId, resourceApi],
  );
  const query = useResourceQuery(queryKey, loadItem);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined);
  const [tryOnUpgradeKind, setTryOnUpgradeKind] = useState<
    ForbiddenUpgradeKind | undefined
  >(undefined);

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

  const { item, wardrobe, outfits, entitlement, entitlementError } = query.data;
  const title = getItemDisplayName(item);
  const wardrobePath = getAppWardrobePath(item.wardrobeId);
  const wardrobeName = readOptionalText(wardrobe?.name) ?? "Wardrobe";
  const colours = item.colours?.map((colour) => colour.trim()).filter(Boolean) ?? [];
  const tags = item.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [];
  const season = readOptionalText(item.season);
  const notes = readOptionalText(item.notes);
  const size = readOptionalText(item.size);
  const processingError = readOptionalText(item.processingError);
  const processingStatus =
    item.processingStatus !== "READY"
      ? getProcessingStatusLabel(item.processingStatus)
      : undefined;
  const galleryUrls = mapRenderImageUrls(item);
  const blockedTryOnKind: ForbiddenUpgradeKind | undefined = entitlement
    ? canUseAiTryOn(entitlement)
      ? undefined
      : "premium"
    : getForbiddenUpgradeKind(entitlementError);
  const upgradeKind = tryOnUpgradeKind ?? undefined;

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

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(undefined);
    try {
      await resourceApi.deleteItem(item.wardrobeId, item.itemId);
      setIsDeleteOpen(false);
      navigate(getAppWardrobePath(item.wardrobeId));
    } catch (error) {
      const serverMessage = isApiError(error) ? error.message.trim() : "";
      setDeleteError(serverMessage || copy.deleteErrorFallback);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVirtualTryOnClick = () => {
    if (blockedTryOnKind) {
      setTryOnUpgradeKind(blockedTryOnKind);
    }
  };

  return (
    <DashboardPage
      headingId="item-detail-heading"
      title={title}
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
      <Stack spacing={3}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" },
            gap: 3,
            alignItems: "stretch",
          }}
        >
          <ItemDetailPhoto imageUrl={getItemImageUrl(item)} alt={title} />
          <Paper
            component="section"
            elevation={0}
            aria-label="Item details"
            sx={{
              borderRadius: 3,
              boxShadow: 1,
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              p: { xs: 2.5, md: 4 },
            }}
          >
            <Stack spacing={2.5}>
              <ItemDetailRow
                label={copy.categoryLabel}
                value={item.category ? getClothingCategoryLabel(item.category) : undefined}
              />
              <ItemDetailRow
                label={copy.subcategoryLabel}
                value={
                  item.subcategory
                    ? getColourLabel(item.subcategory)
                    : undefined
                }
              />
              <ItemDetailRow label={copy.coloursLabel}>
                {colours.length > 0 ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    sx={{ flexWrap: "wrap" }}
                  >
                    {colours.map((colour) => (
                      <Chip
                        key={colour}
                        size="small"
                        label={getColourLabel(colour)}
                        icon={
                          <Box
                            aria-hidden="true"
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: "50%",
                              bgcolor: getColourSwatchHex(colour),
                              border: 1,
                              borderColor: "divider",
                            }}
                          />
                        }
                        sx={{ fontWeight: 600 }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body1">{copy.notSetLabel}</Typography>
                )}
              </ItemDetailRow>
              <ItemDetailRow label={copy.brandLabel} value={item.brand} />
              <ItemDetailRow label={copy.acquiredLabel} value={item.acquiredAt} />
              {season ? (
                <ItemDetailRow label={copy.seasonLabel} value={season} />
              ) : null}
              {notes ? <ItemDetailRow label={copy.notesLabel} value={notes} /> : null}
              {size ? <ItemDetailRow label={copy.sizeLabel} value={size} /> : null}
              {tags.length > 0 ? (
                <ItemDetailRow label={copy.tagsLabel}>
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    sx={{ flexWrap: "wrap" }}
                  >
                    {tags.map((tag) => (
                      <Chip
                        key={tag}
                        size="small"
                        label={tag}
                        color="secondary"
                        sx={{ fontWeight: 600 }}
                      />
                    ))}
                  </Stack>
                </ItemDetailRow>
              ) : null}
              {processingStatus ? (
                <ItemDetailRow
                  label="Status"
                  value={processingStatus}
                />
              ) : null}
              {processingError ? (
                <ItemDetailRow label="Processing" value={processingError} />
              ) : null}
              <ItemDetailRow label={copy.wardrobesLabel}>
                <Chip
                  component={RouterLink}
                  to={wardrobePath}
                  clickable
                  size="small"
                  label={wardrobeName}
                  tabIndex={0}
                  aria-label={wardrobeName}
                  sx={{ fontWeight: 600 }}
                />
              </ItemDetailRow>
              <ItemDetailRow label={copy.outfitsLabel}>
                {outfits.length > 0 ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    sx={{ flexWrap: "wrap" }}
                  >
                    {outfits.map((outfit) => (
                      <Chip
                        key={outfit.outfitId}
                        component={RouterLink}
                        to={getAppOutfitEditPath(outfit.outfitId, outfit.wardrobeId)}
                        clickable
                        size="small"
                        label={outfit.name}
                        tabIndex={0}
                        aria-label={outfit.name}
                        sx={{ fontWeight: 600 }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body1">{copy.notSetLabel}</Typography>
                )}
              </ItemDetailRow>
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ flexWrap: "wrap", pt: 1 }}
              >
                <Button
                  component={RouterLink}
                  to={getAppItemEditPath(item.itemId, item.wardrobeId)}
                  variant="contained"
                  color="primary"
                  tabIndex={0}
                  aria-label={copy.editAriaLabel}
                >
                  {copy.editLabel}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  tabIndex={0}
                  aria-label={copy.deleteAriaLabel}
                  onClick={handleOpenDelete}
                >
                  {copy.deleteLabel}
                </Button>
                {blockedTryOnKind ? (
                  <Button
                    variant="outlined"
                    color="primary"
                    tabIndex={0}
                    aria-label={copy.virtualTryOnAriaLabel}
                    onClick={handleVirtualTryOnClick}
                  >
                    {copy.virtualTryOnLabel}
                  </Button>
                ) : (
                  <Button
                    component={RouterLink}
                    to={appPaths.appVirtualTryOn}
                    variant="outlined"
                    color="primary"
                    tabIndex={0}
                    aria-label={copy.virtualTryOnAriaLabel}
                  >
                    {copy.virtualTryOnLabel}
                  </Button>
                )}
              </Stack>
              {upgradeKind ? (
                <ForbiddenUpgradePrompt
                  kind={upgradeKind}
                  entitlement={entitlement}
                />
              ) : null}
            </Stack>
          </Paper>
        </Box>
        {galleryUrls.length > 0 ? (
          <Stack spacing={2} component="section" aria-label={copy.galleryLabel}>
            <Typography variant="h2" component="h2">
              {copy.galleryLabel}
            </Typography>
            <Box
              component="ul"
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2,
                listStyle: "none",
                p: 0,
                m: 0,
              }}
            >
              {galleryUrls.map((imageUrl, index) => (
                <Box key={`${imageUrl}-${index}`} component="li">
                  <Box
                    sx={{
                      aspectRatio: "3 / 4",
                      overflow: "hidden",
                      borderRadius: 2,
                      border: 1,
                      borderColor: "divider",
                    }}
                  >
                    <ResourceImage
                      imageUrl={imageUrl}
                      alt={`Virtual Try On render ${index + 1}`}
                      fallbackLabel="Virtual Try On photo not available"
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Stack>
        ) : null}
      </Stack>
      <Dialog
        open={isDeleteOpen}
        onClose={handleCloseDelete}
        aria-labelledby="delete-item-title"
      >
        <DialogTitle id="delete-item-title">{copy.deleteConfirmTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2">{copy.deleteConfirmDescription}</Typography>
            {deleteError ? (
              <Typography variant="body2" color="error" role="alert">
                {deleteError}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDelete}
            color="secondary"
            tabIndex={0}
            aria-label="Cancel"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleConfirmDelete();
            }}
            color="primary"
            variant="contained"
            tabIndex={0}
            aria-label={copy.deleteConfirmLabel}
            disabled={isDeleting}
          >
            {copy.deleteConfirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardPage>
  );
};
