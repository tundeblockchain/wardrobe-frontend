import FaceRetouchingNaturalOutlined from "@mui/icons-material/FaceRetouchingNaturalOutlined";
import { Box } from "@mui/material";
import {
  getAiProfileDisplayName,
  getAiProfileImageUrl,
  getAiProfileTypeLabel,
} from "../../api/resourceDisplay";
import {
  isEntitlementAiRequiredError,
  type ResourceApi,
} from "../../api/resourceApi";
import { useResourceApi } from "../../api/useResourceApi";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ResourceCard } from "../../components/dashboard/ResourceCard";
import { ResourceCardGrid } from "../../components/dashboard/ResourceCardGrid";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { ResourceUpgradeState } from "../../components/dashboard/ResourceUpgradeState";
import { dashboardCopy } from "../../content/dashboardCopy";
import { useResourceQuery } from "../../hooks/useResourceQuery";
import { appPaths } from "../../routes/paths";

export type VirtualProfilesPageProps = {
  resourceApi?: ResourceApi;
};

export const VirtualProfilesPage = ({
  resourceApi: resourceApiProp,
}: VirtualProfilesPageProps) => {
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const copy = dashboardCopy.virtualProfiles;
  const query = useResourceQuery("virtual-profiles", resourceApi.listAiProfiles);

  if (query.status === "loading") {
    return (
      <DashboardPage
        headingId="virtual-profiles-heading"
        title={copy.title}
        description={copy.description}
      >
        <ResourceLoadingState label={copy.loadingLabel} />
      </DashboardPage>
    );
  }

  if (query.status === "error") {
    if (isEntitlementAiRequiredError(query.error)) {
      return (
        <DashboardPage
          headingId="virtual-profiles-heading"
          title={copy.title}
          description={copy.description}
        >
          <ResourceUpgradeState
            title={copy.upgradeTitle}
            description={copy.upgradeDescription}
            actionLabel={copy.upgradeActionLabel}
            actionTo={appPaths.appPlan}
            actionAriaLabel={copy.upgradeActionAriaLabel}
          />
        </DashboardPage>
      );
    }

    return (
      <DashboardPage
        headingId="virtual-profiles-heading"
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

  if (query.data.aiProfiles.length === 0) {
    return (
      <DashboardPage
        headingId="virtual-profiles-heading"
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
      headingId="virtual-profiles-heading"
      title={copy.title}
      description={copy.description}
    >
      <ResourceCardGrid label="Virtual Profiles">
        {query.data.aiProfiles.map((profile) => {
          const title = getAiProfileDisplayName(profile);
          const titleId = `virtual-profile-${profile.aiProfileId}-title`;
          return (
            <Box key={profile.aiProfileId} component="li" sx={{ minWidth: 0 }}>
              <ResourceCard
                title={title}
                titleId={titleId}
                imageUrl={getAiProfileImageUrl(profile)}
                imageAlt={title}
                fallbackLabel="No photo for this Virtual Profile"
                FallbackIcon={FaceRetouchingNaturalOutlined}
                chips={[getAiProfileTypeLabel(profile.type)]}
                description={
                  profile.notes?.trim() ||
                  "Use this Virtual Profile for Virtual Try On."
                }
              />
            </Box>
          );
        })}
      </ResourceCardGrid>
    </DashboardPage>
  );
};
