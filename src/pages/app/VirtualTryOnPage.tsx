import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckroomOutlined from "@mui/icons-material/CheckroomOutlined";
import FaceRetouchingNaturalOutlined from "@mui/icons-material/FaceRetouchingNaturalOutlined";
import StyleOutlined from "@mui/icons-material/StyleOutlined";
import {
  canUseAiTryOn,
  canUseOtherAi,
  getCatalogKindForLimitCode,
  getForbiddenUpgradeKind,
} from "../../api/entitlementGating";
import { isApiError } from "../../api/httpClient";
import {
  getAiProfileDisplayName,
  getAiProfileImageUrl,
  getAiProfileTypeLabel,
  getItemImageUrl,
  getOutfitImageUrl,
} from "../../api/resourceDisplay";
import { mapRenderGalleryNewestFirst } from "../../api/renderImages";
import type { ResourceApi } from "../../api/resourceApi";
import type {
  AiProfile,
  ClothingItem,
  Entitlement,
  Outfit,
  Wardrobe,
} from "../../api/resourceTypes";
import { useResourceApi } from "../../api/useResourceApi";
import { loadListedVirtualProfiles } from "../../api/virtualProfiles";
import { AddVirtualProfileCard } from "../../components/dashboard/AddVirtualProfileCard";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { FormCard } from "../../components/dashboard/FormCard";
import { ForbiddenUpgradePrompt } from "../../components/dashboard/ForbiddenUpgradePrompt";
import {
  HorizontalResourceCardItem,
  HorizontalResourceCardList,
} from "../../components/dashboard/HorizontalResourceCardList";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceImage } from "../../components/dashboard/ResourceImage";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { SelectableResourceCard } from "../../components/dashboard/SelectableResourceCard";
import { dashboardCopy } from "../../content/dashboardCopy";
import { useResourceQuery } from "../../hooks/useResourceQuery";
import { appPaths } from "../../routes/paths";
import {
  canSelectVirtualProfile,
  type VirtualTryOnSource,
} from "./virtualTryOnPickOrder";

export type VirtualTryOnPageProps = {
  resourceApi?: ResourceApi;
};

type VirtualTryOnData = {
  entitlement: Entitlement;
  profiles: AiProfile[];
  wardrobes: Wardrobe[];
  outfits: Outfit[];
  items: ClothingItem[];
};

const loadVirtualTryOnData = async (
  resourceApi: ResourceApi,
): Promise<VirtualTryOnData> => {
  const [entitlement, wardrobeList, outfitList, profiles] = await Promise.all([
    resourceApi.getMe(),
    resourceApi.listWardrobes(),
    resourceApi.listOutfits(),
    loadListedVirtualProfiles(resourceApi),
  ]);

  const itemLists = await Promise.all(
    wardrobeList.wardrobes.map((wardrobe) =>
      resourceApi.listWardrobeItems(wardrobe.wardrobeId),
    ),
  );

  return {
    entitlement,
    profiles,
    wardrobes: wardrobeList.wardrobes,
    outfits: outfitList.outfits,
    items: itemLists.flatMap((list) => list.items),
  };
};

export const VirtualTryOnPage = ({
  resourceApi: resourceApiProp,
}: VirtualTryOnPageProps) => {
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const copy = dashboardCopy.virtualTryOn;
  const loadPage = useMemo(
    () => () => loadVirtualTryOnData(resourceApi),
    [resourceApi],
  );
  const query = useResourceQuery("virtual-try-on", loadPage);

  if (query.status === "loading") {
    return (
      <DashboardPage
        headingId="virtual-try-on-heading"
        title={copy.title}
        description={copy.description}
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
          headingId="virtual-try-on-heading"
          title={copy.title}
          description={copy.description}
        >
          <ForbiddenUpgradePrompt
            kind={upgradeKind}
            catalogKind={getCatalogKindForLimitCode(query.error.code)}
          />
        </DashboardPage>
      );
    }

    return (
      <DashboardPage
        headingId="virtual-try-on-heading"
        title={copy.title}
        description={copy.description}
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

  if (!canUseAiTryOn(query.data.entitlement)) {
    return (
      <DashboardPage
        headingId="virtual-try-on-heading"
        title={copy.title}
        description={copy.description}
      >
        <ForbiddenUpgradePrompt
          kind="premium"
          entitlement={query.data.entitlement}
        />
      </DashboardPage>
    );
  }

  return (
    <VirtualTryOnReady resourceApi={resourceApi} data={query.data} />
  );
};

type VirtualTryOnReadyProps = {
  resourceApi: ResourceApi;
  data: VirtualTryOnData;
};

const VirtualTryOnReady = ({
  resourceApi,
  data,
}: VirtualTryOnReadyProps) => {
  const navigate = useNavigate();
  const copy = dashboardCopy.virtualTryOn;
  const canWriteProfiles = canUseOtherAi(data.entitlement);
  const [aiProfileId, setAiProfileId] = useState("");
  const [source, setSource] = useState<VirtualTryOnSource>("items");
  const [wardrobeId, setWardrobeId] = useState(
    data.wardrobes[0]?.wardrobeId ?? "",
  );
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [outfitId, setOutfitId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [upgradeKind, setUpgradeKind] = useState<
    ReturnType<typeof getForbiddenUpgradeKind>
  >(undefined);
  const [renderedItems, setRenderedItems] = useState<ClothingItem[]>([]);
  const [renderedOutfits, setRenderedOutfits] = useState<Outfit[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();

  const wardrobeItems = data.items.filter(
    (item) => item.wardrobeId === wardrobeId,
  );
  const wardrobeOutfits = data.outfits.filter(
    (outfit) => outfit.wardrobeId === wardrobeId,
  );
  const profilePickerEnabled = canSelectVirtualProfile(
    source,
    selectedItemIds,
    outfitId,
  );

  const galleryUrls = mapRenderGalleryNewestFirst([
    ...data.items,
    ...data.outfits,
    ...renderedItems,
    ...renderedOutfits,
  ]);

  const handleSourceChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSource(event.target.value as VirtualTryOnSource);
    setAiProfileId("");
    setFieldError(undefined);
    setFormError(undefined);
  };

  const handleProfileSelect = (profileId: string) => {
    if (!profilePickerEnabled) {
      return;
    }

    setAiProfileId(profileId);
    setFieldError(undefined);
  };

  const handleItemToggle = (itemId: string) => {
    setSelectedItemIds((currentIds) => {
      if (currentIds.includes(itemId)) {
        return currentIds.filter((id) => id !== itemId);
      }

      return [...currentIds, itemId];
    });
    setFieldError(undefined);
  };

  const handleOutfitSelect = (nextOutfitId: string) => {
    setOutfitId(nextOutfitId);
    setFieldError(undefined);
  };

  const handleCancel = () => {
    navigate(appPaths.app);
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (source === "items" && selectedItemIds.length === 0) {
      setFieldError(copy.validationItems);
      return;
    }

    if (source === "outfit" && !outfitId.trim()) {
      setFieldError(copy.validationOutfit);
      return;
    }

    if (!aiProfileId.trim()) {
      setFieldError(copy.validationProfile);
      return;
    }

    setIsSubmitting(true);
    setFormError(undefined);
    setStatusMessage(undefined);
    try {
      if (source === "items") {
        const nextItems: ClothingItem[] = [];
        for (const itemId of selectedItemIds) {
          const item = wardrobeItems.find((entry) => entry.itemId === itemId);
          if (!item) {
            continue;
          }

          nextItems.push(
            await resourceApi.renderItem(item.wardrobeId, item.itemId, {
              aiProfileId,
            }),
          );
        }
        setRenderedItems((current) => [...nextItems, ...current]);
      } else {
        const outfit = wardrobeOutfits.find(
          (entry) => entry.outfitId === outfitId,
        );
        if (!outfit) {
          setFieldError(copy.validationOutfit);
          return;
        }

        const rendered = await resourceApi.renderOutfit(
          outfit.wardrobeId,
          outfit.outfitId,
          { aiProfileId },
        );
        setRenderedOutfits((current) => [rendered, ...current]);
      }

      setStatusMessage(copy.pendingLabel);
    } catch (error) {
      const nextUpgrade = getForbiddenUpgradeKind(error);
      if (nextUpgrade) {
        setUpgradeKind(nextUpgrade);
        return;
      }

      setFormError(
        isApiError(error) ? error.message : copy.renderErrorDescription,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (upgradeKind) {
    return (
      <DashboardPage
        headingId="virtual-try-on-heading"
        title={copy.title}
        description={copy.description}
      >
        <ForbiddenUpgradePrompt
          kind={upgradeKind}
          entitlement={data.entitlement}
        />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      headingId="virtual-try-on-heading"
      title={copy.title}
      description={copy.description}
    >
      <Stack spacing={4} sx={{ minWidth: 0, width: "100%" }}>
        <Stack spacing={2} component="section" aria-label={copy.galleryLabel}>
          <Typography variant="h2" component="h2">
            {copy.galleryLabel}
          </Typography>
          {statusMessage ? (
            <Typography variant="body2" color="text.secondary" role="status">
              {statusMessage}
            </Typography>
          ) : null}
          {galleryUrls.length === 0 ? (
            <ResourceEmptyState
              title={copy.galleryEmptyTitle}
              description={copy.galleryEmptyDescription}
            />
          ) : (
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
          )}
        </Stack>
        <FormCard
          title={copy.title}
          onCancel={handleCancel}
          submitLabel={copy.submitLabel}
          submittingLabel={copy.submittingLabel}
          isSubmitting={isSubmitting}
          onSubmit={() => {
            void handleSubmit();
          }}
        >
          {formError ? (
            <Alert severity="error" role="alert">
              {`${copy.renderErrorTitle}. ${formError}`}
            </Alert>
          ) : null}
          {fieldError ? (
            <Alert severity="error" role="alert">
              {fieldError}
            </Alert>
          ) : null}
          <FormControl>
            <FormLabel id="virtual-try-on-source-label">
              {copy.sourceLabel}
            </FormLabel>
            <RadioGroup
              aria-labelledby="virtual-try-on-source-label"
              name="source"
              value={source}
              onChange={handleSourceChange}
            >
              <FormControlLabel
                value="items"
                control={<Radio tabIndex={0} />}
                label={copy.sourceItemsLabel}
              />
              <FormControlLabel
                value="outfit"
                control={<Radio tabIndex={0} />}
                label={copy.sourceOutfitLabel}
              />
            </RadioGroup>
          </FormControl>
          <TextField
            id="virtual-try-on-wardrobe"
            name="wardrobeId"
            label={copy.wardrobeLabel}
            value={wardrobeId}
            onChange={(event) => {
              setWardrobeId(event.target.value);
              setSelectedItemIds([]);
              setOutfitId("");
              setAiProfileId("");
            }}
            select
            slotProps={{
              htmlInput: { "aria-label": copy.wardrobeLabel },
            }}
          >
            {data.wardrobes.map((wardrobe) => (
              <MenuItem key={wardrobe.wardrobeId} value={wardrobe.wardrobeId}>
                {wardrobe.name}
              </MenuItem>
            ))}
          </TextField>
          {source === "items" ? (
            <FormControl
              component="fieldset"
              variant="standard"
              sx={{ minWidth: 0, width: "100%" }}
            >
              <FormLabel component="legend">{copy.itemsLabel}</FormLabel>
              {wardrobeItems.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {copy.itemsEmpty}
                </Typography>
              ) : (
                <HorizontalResourceCardList label={copy.itemsLabel}>
                  {wardrobeItems.map((item) => {
                    const titleId = `virtual-try-on-item-${item.itemId}-title`;
                    return (
                      <HorizontalResourceCardItem key={item.itemId}>
                        <SelectableResourceCard
                          title={item.name}
                          titleId={titleId}
                          imageUrl={getItemImageUrl(item)}
                          imageAlt={item.name}
                          fallbackLabel="No photo for this clothing item"
                          FallbackIcon={CheckroomOutlined}
                          selected={selectedItemIds.includes(item.itemId)}
                          selection="multi"
                          onSelect={() => {
                            handleItemToggle(item.itemId);
                          }}
                        />
                      </HorizontalResourceCardItem>
                    );
                  })}
                </HorizontalResourceCardList>
              )}
            </FormControl>
          ) : wardrobeOutfits.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {copy.outfitsEmpty}
            </Typography>
          ) : (
            <FormControl
              component="fieldset"
              variant="standard"
              sx={{ minWidth: 0, width: "100%" }}
            >
              <FormLabel component="legend">{copy.outfitsLabel}</FormLabel>
              <HorizontalResourceCardList label={copy.outfitsLabel}>
                {wardrobeOutfits.map((outfit) => {
                  const titleId = `virtual-try-on-outfit-${outfit.outfitId}-title`;
                  return (
                    <HorizontalResourceCardItem key={outfit.outfitId}>
                      <SelectableResourceCard
                        title={outfit.name}
                        titleId={titleId}
                        imageUrl={getOutfitImageUrl(outfit)}
                        imageAlt={outfit.name}
                        fallbackLabel="No photo for this outfit"
                        FallbackIcon={StyleOutlined}
                        selected={outfitId === outfit.outfitId}
                        selection="single"
                        onSelect={() => {
                          handleOutfitSelect(outfit.outfitId);
                        }}
                      />
                    </HorizontalResourceCardItem>
                  );
                })}
              </HorizontalResourceCardList>
            </FormControl>
          )}
          <FormControl
            component="fieldset"
            variant="standard"
            sx={{ minWidth: 0, width: "100%" }}
          >
            <FormLabel component="legend" id="virtual-try-on-profile-label">
              {copy.profileLabel}
            </FormLabel>
            {!profilePickerEnabled ? (
              <Typography variant="body2" color="text.secondary">
                {copy.profileLocked}
              </Typography>
            ) : null}
            {data.profiles.length === 0 && !canWriteProfiles ? (
              <Typography variant="body2" color="text.secondary">
                {copy.profileEmpty}
              </Typography>
            ) : (
              <HorizontalResourceCardList label={copy.profileLabel}>
                {canWriteProfiles ? (
                  <HorizontalResourceCardItem>
                    <AddVirtualProfileCard />
                  </HorizontalResourceCardItem>
                ) : null}
                {data.profiles.map((profile) => {
                  const title = getAiProfileDisplayName(profile);
                  const titleId = `virtual-try-on-profile-${profile.aiProfileId}-title`;
                  return (
                    <HorizontalResourceCardItem key={profile.aiProfileId}>
                      <SelectableResourceCard
                        title={title}
                        titleId={titleId}
                        imageUrl={getAiProfileImageUrl(profile)}
                        imageAlt={title}
                        fallbackLabel="No photo for this Virtual Profile"
                        FallbackIcon={FaceRetouchingNaturalOutlined}
                        chips={[getAiProfileTypeLabel(profile.type)]}
                        selected={aiProfileId === profile.aiProfileId}
                        selection="single"
                        disabled={!profilePickerEnabled}
                        onSelect={() => {
                          handleProfileSelect(profile.aiProfileId);
                        }}
                      />
                    </HorizontalResourceCardItem>
                  );
                })}
              </HorizontalResourceCardList>
            )}
          </FormControl>
        </FormCard>
      </Stack>
    </DashboardPage>
  );
};
