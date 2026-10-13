import StyleOutlined from "@mui/icons-material/StyleOutlined";
import { Box } from "@mui/material";
import { getOutfitImageUrl } from "../../api/resourceDisplay";
import type { ResourceApi } from "../../api/resourceApi";
import { useResourceApi } from "../../api/useResourceApi";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ResourceCard } from "../../components/dashboard/ResourceCard";
import { ResourceCardGrid } from "../../components/dashboard/ResourceCardGrid";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { dashboardCopy } from "../../content/dashboardCopy";
import { useResourceQuery } from "../../hooks/useResourceQuery";

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
  const query = useResourceQuery("outfits", resourceApi.listOutfits);

  if (query.status === "loading") {
    return (
      <DashboardPage
        headingId="outfits-heading"
        title={copy.title}
        description={copy.description}
      >
        <ResourceLoadingState label={copy.loadingLabel} />
      </DashboardPage>
    );
  }

  if (query.status === "error") {
    return (
      <DashboardPage
        headingId="outfits-heading"
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

  if (query.data.outfits.length === 0) {
    return (
      <DashboardPage
        headingId="outfits-heading"
        title={copy.title}
        description={copy.description}
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
      headingId="outfits-heading"
      title={copy.title}
      description={copy.description}
    >
      <ResourceCardGrid label="Outfits">
        {query.data.outfits.map((outfit) => {
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
              />
            </Box>
          );
        })}
      </ResourceCardGrid>
    </DashboardPage>
  );
};
