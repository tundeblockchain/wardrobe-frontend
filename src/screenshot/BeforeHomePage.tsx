import { Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { mockWardrobes } from "../api/mockResourceApi";
import { DashboardPage } from "../components/dashboard/DashboardPage";
import { ResourceEmptyState } from "../components/dashboard/ResourceEmptyState";
import { WardrobeCardGrid } from "../components/dashboard/WardrobeCardGrid";
import { dashboardCopy } from "../content/dashboardCopy";
import { appPaths } from "../routes/paths";

export type BeforeHomePageProps = {
  emptyWardrobes: boolean;
};

export const BeforeHomePage = ({ emptyWardrobes }: BeforeHomePageProps) => {
  const copy = dashboardCopy.home;
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

  if (emptyWardrobes) {
    return (
      <DashboardPage
        headingId="app-home-heading"
        title={copy.title}
        description="Open a wardrobe to browse its clothing items."
      >
        <ResourceEmptyState
          title={copy.emptyTitle}
          description={copy.emptyDescription}
        >
          {addAction}
        </ResourceEmptyState>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      headingId="app-home-heading"
      title={copy.title}
      description="Open a wardrobe to browse its clothing items."
      actions={addAction}
    >
      <WardrobeCardGrid wardrobes={mockWardrobes} />
    </DashboardPage>
  );
};
