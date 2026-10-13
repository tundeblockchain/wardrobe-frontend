import { Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useResourceApi } from "../../api/useResourceApi";
import type { ResourceApi } from "../../api/resourceApi";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { WardrobeCardGrid } from "../../components/dashboard/WardrobeCardGrid";
import { dashboardCopy } from "../../content/dashboardCopy";
import { useResourceQuery } from "../../hooks/useResourceQuery";
import { appPaths } from "../../routes/paths";

export type AppHomePageProps = {
  resourceApi?: ResourceApi;
};

export const AppHomePage = ({
  resourceApi: resourceApiProp,
}: AppHomePageProps) => {
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const copy = dashboardCopy.home;
  const query = useResourceQuery("home-wardrobes", resourceApi.listWardrobes);
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

  if (query.status === "loading") {
    return (
      <DashboardPage
        headingId="app-home-heading"
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
        headingId="app-home-heading"
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
        headingId="app-home-heading"
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
      headingId="app-home-heading"
      title={copy.title}
      description={copy.description}
      actions={addAction}
    >
      <WardrobeCardGrid wardrobes={query.data.wardrobes} />
    </DashboardPage>
  );
};
