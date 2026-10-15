import { useState } from "react";
import StyleOutlined from "@mui/icons-material/StyleOutlined";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { getOutfitImageUrl } from "../../api/resourceDisplay";
import type { ResourceApi } from "../../api/resourceApi";
import { useResourceApi } from "../../api/useResourceApi";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ResourceCard } from "../../components/dashboard/ResourceCard";
import { ResourceCardGrid } from "../../components/dashboard/ResourceCardGrid";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import {
  SuggestedOutfitsEmptyPanel,
  SuggestedOutfitsPanel,
} from "../../components/dashboard/SuggestedOutfitsPanel";
import { dashboardCopy } from "../../content/dashboardCopy";
import { useResourceQuery } from "../../hooks/useResourceQuery";
import { appPaths, getAppOutfitEditPath } from "../../routes/paths";

export type OutfitsPageProps = {
  resourceApi?: ResourceApi;
};

const getOutfitItemCountLabel = (count: number): string => {
  if (count === 1) {
    return "1 item";
  }

  return `${count} items`;
};

export const OutfitsPage = ({
  resourceApi: resourceApiProp,
}: OutfitsPageProps) => {
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const copy = dashboardCopy.outfits;
  const outfitsQuery = useResourceQuery("outfits", resourceApi.listOutfits);
  const wardrobesQuery = useResourceQuery(
    "wardrobes",
    resourceApi.listWardrobes,
  );
  const [selectedWardrobeId, setSelectedWardrobeId] = useState("");
  const wardrobes =
    wardrobesQuery.status === "ready" ? wardrobesQuery.data.wardrobes : [];
  const wardrobeId = selectedWardrobeId || wardrobes[0]?.wardrobeId || "";
  const hasSavedOutfits =
    outfitsQuery.status === "ready" && outfitsQuery.data.outfits.length > 0;

  const handleWardrobeChange = (nextWardrobeId: string) => {
    setSelectedWardrobeId(nextWardrobeId);
  };

  const addAction = (
    <Button
      component={RouterLink}
      to={appPaths.appOutfitNew}
      variant="contained"
      color="primary"
      tabIndex={0}
      aria-label={copy.addAriaLabel}
    >
      {copy.addLabel}
    </Button>
  );

  const suggestions =
    wardrobeId.length > 0 ? (
      <SuggestedOutfitsPanel
        resourceApi={resourceApi}
        wardrobeId={wardrobeId}
        wardrobes={wardrobes}
        onWardrobeChange={handleWardrobeChange}
      />
    ) : wardrobesQuery.status === "loading" ? (
      <Stack
        spacing={2}
        component="section"
        aria-label={dashboardCopy.recommendations.listLabel}
      >
        <Typography variant="h2" component="h2">
          {dashboardCopy.recommendations.title}
        </Typography>
        <ResourceLoadingState
          label={dashboardCopy.recommendations.loadingLabel}
        />
      </Stack>
    ) : (
      <SuggestedOutfitsEmptyPanel />
    );

  const outfitsSection = (() => {
    if (outfitsQuery.status === "loading") {
      return <ResourceLoadingState label={copy.loadingLabel} />;
    }

    if (outfitsQuery.status === "error") {
      return (
        <ResourceErrorState
          title={copy.errorTitle}
          description={copy.errorDescription}
          retryLabel={copy.retryLabel}
          onRetry={outfitsQuery.handleRetry}
        />
      );
    }

    if (outfitsQuery.data.outfits.length === 0) {
      return (
        <Stack spacing={2}>
          <ResourceEmptyState
            title={copy.emptyTitle}
            description={copy.emptyDescription}
          />
          {addAction}
        </Stack>
      );
    }

    return (
      <ResourceCardGrid label="Outfits">
        {outfitsQuery.data.outfits.map((outfit) => {
          const titleId = `outfit-${outfit.outfitId}-title`;
          return (
            <Box key={outfit.outfitId} component="li" sx={{ minWidth: 0 }}>
              <ResourceCard
                title={outfit.name}
                titleId={titleId}
                imageUrl={getOutfitImageUrl(outfit)}
                imageAlt={outfit.name}
                fallbackLabel="No photo for this outfit"
                FallbackIcon={StyleOutlined}
                chips={[getOutfitItemCountLabel(outfit.items.length)]}
                description="Saved look from this wardrobe."
              >
                <Button
                  component={RouterLink}
                  to={getAppOutfitEditPath(outfit.outfitId, outfit.wardrobeId)}
                  variant="outlined"
                  color="secondary"
                  tabIndex={0}
                  aria-label={`${copy.editLabel} ${outfit.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  {copy.editLabel}
                </Button>
              </ResourceCard>
            </Box>
          );
        })}
      </ResourceCardGrid>
    );
  })();

  return (
    <DashboardPage
      headingId="outfits-heading"
      title={copy.title}
      description={copy.description}
      actions={hasSavedOutfits ? addAction : undefined}
    >
      <Stack spacing={4}>
        {outfitsSection}
        {outfitsQuery.status === "error" ? null : suggestions}
      </Stack>
    </DashboardPage>
  );
};
