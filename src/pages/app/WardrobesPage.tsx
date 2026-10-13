import CheckroomOutlined from "@mui/icons-material/CheckroomOutlined";
import { Box, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ResourceCard } from "../../components/dashboard/ResourceCard";
import { ResourceCardGrid } from "../../components/dashboard/ResourceCardGrid";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { useResourceApi } from "../../api/useResourceApi";
import type { ResourceApi } from "../../api/resourceApi";
import { dashboardCopy } from "../../content/dashboardCopy";
import { useResourceQuery } from "../../hooks/useResourceQuery";
import { appPaths, getAppWardrobePath } from "../../routes/paths";

export type WardrobesPageProps = {
  resourceApi?: ResourceApi;
};

export const WardrobesPage = ({
  resourceApi: resourceApiProp,
}: WardrobesPageProps) => {
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const copy = dashboardCopy.wardrobes;
  const query = useResourceQuery("wardrobes", resourceApi.listWardrobes);
  const addAction = (
    <Button
      component={RouterLink}
      to={appPaths.appWardrobeNew}
      variant="contained"
      color="primary"
      tabIndex={0}
      aria-label={copy.addAriaLabel}
    >
      {copy.addLabel}
    </Button>
  );

  if (query.status === "loading") {
    return (
      <DashboardPage
        headingId="wardrobes-heading"
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
        headingId="wardrobes-heading"
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

  if (query.data.wardrobes.length === 0) {
    return (
      <DashboardPage
        headingId="wardrobes-heading"
        title={copy.title}
        description={copy.description}
      >
        <ResourceEmptyState
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        />
        {addAction}
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      headingId="wardrobes-heading"
      title={copy.title}
      description={copy.description}
      actions={addAction}
    >
      <ResourceCardGrid label="Wardrobes">
        {query.data.wardrobes.map((wardrobe) => {
          const titleId = `wardrobe-${wardrobe.wardrobeId}-title`;
          return (
            <Box key={wardrobe.wardrobeId} component="li" sx={{ minWidth: 0 }}>
              <ResourceCard
                to={getAppWardrobePath(wardrobe.wardrobeId)}
                title={wardrobe.name}
                titleId={titleId}
                imageAlt={wardrobe.name}
                fallbackLabel="No photo for this wardrobe"
                FallbackIcon={CheckroomOutlined}
                description="Open this wardrobe to see its clothing items."
              />
            </Box>
          );
        })}
      </ResourceCardGrid>
    </DashboardPage>
  );
};
