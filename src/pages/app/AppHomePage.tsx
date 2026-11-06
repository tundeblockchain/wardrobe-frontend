import { useMemo, type ReactNode } from "react";
import { Button, Stack } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useResourceApi } from "../../api/useResourceApi";
import type { ResourceApi } from "../../api/resourceApi";
import type { WishlistApi } from "../../api/wishlistApi";
import { loadWardrobesWithCoverFallbacks } from "../../api/wardrobeCoverFallback";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { WardrobeCardGrid } from "../../components/dashboard/WardrobeCardGrid";
import { WishListRow } from "../../components/dashboard/WishListRow";
import { dashboardCopy } from "../../content/dashboardCopy";
import {
  useResourceQuery,
  type UseResourceQueryResult,
} from "../../hooks/useResourceQuery";
import type { WardrobeList } from "../../api/resourceTypes";
import { putFileToPresignedUrl } from "../../api/uploadToPresignedUrl";
import { appPaths } from "../../routes/paths";

export type AppHomePageProps = {
  resourceApi?: ResourceApi;
  wishlistApi?: WishlistApi;
  putFile?: typeof putFileToPresignedUrl;
};

type HomeWardrobesSectionProps = {
  query: UseResourceQueryResult<WardrobeList>;
  addAction: ReactNode;
};

const HomeWardrobesSection = ({
  query,
  addAction,
}: HomeWardrobesSectionProps) => {
  const copy = dashboardCopy.home;

  if (query.status === "loading") {
    return <ResourceLoadingState label={copy.loadingLabel} />;
  }

  if (query.status === "error") {
    return (
      <ResourceErrorState
        title={copy.errorTitle}
        description={copy.errorDescription}
        retryLabel={copy.retryLabel}
        onRetry={query.handleRetry}
      />
    );
  }

  if (query.data.wardrobes.length === 0) {
    return (
      <ResourceEmptyState
        title={copy.emptyTitle}
        description={copy.emptyDescription}
      >
        {addAction}
      </ResourceEmptyState>
    );
  }

  return <WardrobeCardGrid wardrobes={query.data.wardrobes} />;
};

export const AppHomePage = ({
  resourceApi: resourceApiProp,
  wishlistApi,
  putFile,
}: AppHomePageProps) => {
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const copy = dashboardCopy.home;
  const loadWardrobes = useMemo(
    () => () => loadWardrobesWithCoverFallbacks(resourceApi),
    [resourceApi],
  );
  const query = useResourceQuery("home-wardrobes", loadWardrobes);
  const addAction = (
    <Button
      component={RouterLink}
      to={appPaths.appWardrobeNew}
      variant="contained"
      color="primary"
      tabIndex={0}
      aria-label={dashboardCopy.wardrobes.addAriaLabel}
    >
      {dashboardCopy.wardrobes.addLabel}
    </Button>
  );
  const hasWardrobes =
    query.status === "ready" && query.data.wardrobes.length > 0;

  return (
    <DashboardPage
      headingId="app-home-heading"
      title={copy.title}
      description={copy.description}
      actions={hasWardrobes ? addAction : undefined}
    >
      <Stack spacing={4} sx={{ minWidth: 0, width: "100%" }}>
        <HomeWardrobesSection query={query} addAction={addAction} />
        <WishListRow
          resourceApi={resourceApi}
          wishlistApi={wishlistApi}
          putFile={putFile}
        />
      </Stack>
    </DashboardPage>
  );
};
