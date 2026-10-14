import { useState } from "react";
import FaceRetouchingNaturalOutlined from "@mui/icons-material/FaceRetouchingNaturalOutlined";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  getAiProfileDisplayName,
  getAiProfileImageUrl,
  getAiProfileTypeLabel,
} from "../../api/resourceDisplay";
import {
  canUseAiTryOn,
  canUseOtherAi,
  getCatalogKindForLimitCode,
  getForbiddenUpgradeKind,
} from "../../api/entitlementGating";
import { isApiError } from "../../api/httpClient";
import { type ResourceApi } from "../../api/resourceApi";
import type { AiProfile, Entitlement } from "../../api/resourceTypes";
import { useResourceApi } from "../../api/useResourceApi";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ForbiddenUpgradePrompt } from "../../components/dashboard/ForbiddenUpgradePrompt";
import { ResourceCard } from "../../components/dashboard/ResourceCard";
import { ResourceCardGrid } from "../../components/dashboard/ResourceCardGrid";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { dashboardCopy } from "../../content/dashboardCopy";
import { useResourceQuery } from "../../hooks/useResourceQuery";
import { appPaths, getAppVirtualProfileEditPath } from "../../routes/paths";

export type VirtualProfilesPageProps = {
  resourceApi?: ResourceApi;
};

export const VirtualProfilesPage = ({
  resourceApi: resourceApiProp,
}: VirtualProfilesPageProps) => {
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const copy = dashboardCopy.virtualProfiles;
  const meQuery = useResourceQuery("me", resourceApi.getMe);
  const profilesQuery = useResourceQuery(
    "virtual-profiles",
    resourceApi.listAiProfiles,
  );

  if (meQuery.status === "loading") {
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

  if (meQuery.status === "error") {
    const upgradeKind = getForbiddenUpgradeKind(meQuery.error);
    if (upgradeKind) {
      return (
        <DashboardPage
          headingId="virtual-profiles-heading"
          title={copy.title}
          description={copy.description}
        >
          <ForbiddenUpgradePrompt
            kind={upgradeKind}
            catalogKind={getCatalogKindForLimitCode(meQuery.error.code)}
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
          onRetry={meQuery.handleRetry}
        />
      </DashboardPage>
    );
  }

  if (!canUseAiTryOn(meQuery.data)) {
    return (
      <DashboardPage
        headingId="virtual-profiles-heading"
        title={copy.title}
        description={copy.description}
      >
        <ForbiddenUpgradePrompt
          kind="premium"
          entitlement={meQuery.data}
        />
      </DashboardPage>
    );
  }

  if (profilesQuery.status === "loading") {
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

  if (profilesQuery.status === "error") {
    const upgradeKind = getForbiddenUpgradeKind(profilesQuery.error);
    if (upgradeKind) {
      return (
        <DashboardPage
          headingId="virtual-profiles-heading"
          title={copy.title}
          description={copy.description}
        >
          <ForbiddenUpgradePrompt
            kind={upgradeKind}
            catalogKind={getCatalogKindForLimitCode(profilesQuery.error.code)}
            entitlement={meQuery.data}
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
          onRetry={profilesQuery.handleRetry}
        />
      </DashboardPage>
    );
  }

  return (
    <VirtualProfilesReady
      resourceApi={resourceApi}
      entitlement={meQuery.data}
      profiles={profilesQuery.data.aiProfiles}
      onReload={profilesQuery.handleRetry}
    />
  );
};

type VirtualProfilesReadyProps = {
  resourceApi: ResourceApi;
  entitlement: Entitlement;
  profiles: AiProfile[];
  onReload: () => void;
};

const VirtualProfilesReady = ({
  resourceApi,
  entitlement,
  profiles,
  onReload,
}: VirtualProfilesReadyProps) => {
  const copy = dashboardCopy.virtualProfiles;
  const canWrite = canUseOtherAi(entitlement);
  const [profileToDelete, setProfileToDelete] = useState<AiProfile | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [upgradeKind, setUpgradeKind] = useState<
    ReturnType<typeof getForbiddenUpgradeKind>
  >(undefined);

  const handleOpenDelete = (profile: AiProfile) => {
    setDeleteError(undefined);
    setProfileToDelete(profile);
  };

  const handleCloseDelete = () => {
    if (isDeleting) {
      return;
    }

    setProfileToDelete(undefined);
  };

  const handleConfirmDelete = async () => {
    if (!profileToDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(undefined);
    try {
      await resourceApi.deleteAiProfile(profileToDelete.aiProfileId);
      setProfileToDelete(undefined);
      onReload();
    } catch (error) {
      const nextUpgrade = getForbiddenUpgradeKind(error);
      if (nextUpgrade) {
        setUpgradeKind(nextUpgrade);
        setProfileToDelete(undefined);
        return;
      }

      setDeleteError(
        isApiError(error) ? error.message : copy.errorDescription,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const addAction = canWrite ? (
    <Button
      component={RouterLink}
      to={appPaths.appVirtualProfileNew}
      variant="contained"
      color="primary"
      tabIndex={0}
      aria-label={copy.addAriaLabel}
    >
      {copy.addLabel}
    </Button>
  ) : undefined;

  if (upgradeKind) {
    return (
      <DashboardPage
        headingId="virtual-profiles-heading"
        title={copy.title}
        description={copy.description}
      >
        <ForbiddenUpgradePrompt
          kind={upgradeKind}
          entitlement={entitlement}
          premiumTitle={copy.otherAiTitle}
          premiumDescription={copy.otherAiDescription}
          premiumActionAriaLabel={copy.otherAiActionAriaLabel}
        />
      </DashboardPage>
    );
  }

  if (profiles.length === 0) {
    return (
      <DashboardPage
        headingId="virtual-profiles-heading"
        title={copy.title}
        description={copy.description}
      >
        {canWrite ? (
          <>
            <ResourceEmptyState
              title={copy.emptyTitle}
              description={copy.emptyDescription}
            />
            {addAction}
          </>
        ) : (
          <ForbiddenUpgradePrompt
            kind="premium"
            entitlement={entitlement}
            premiumTitle={copy.otherAiTitle}
            premiumDescription={copy.otherAiDescription}
            premiumActionAriaLabel={copy.otherAiActionAriaLabel}
          />
        )}
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      headingId="virtual-profiles-heading"
      title={copy.title}
      description={copy.description}
      actions={addAction}
    >
      <ResourceCardGrid label="Virtual Profiles">
        {profiles.map((profile) => {
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
              >
                {canWrite && profile.type === "PERSONAL" ? (
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                    <Button
                      component={RouterLink}
                      to={getAppVirtualProfileEditPath(profile.aiProfileId)}
                      variant="outlined"
                      color="secondary"
                      tabIndex={0}
                      aria-label={`${copy.editLabel} ${title}`}
                    >
                      {copy.editLabel}
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      tabIndex={0}
                      aria-label={`${copy.deleteLabel} ${title}`}
                      onClick={() => {
                        handleOpenDelete(profile);
                      }}
                    >
                      {copy.deleteLabel}
                    </Button>
                  </Stack>
                ) : null}
              </ResourceCard>
            </Box>
          );
        })}
      </ResourceCardGrid>
      <Dialog
        open={Boolean(profileToDelete)}
        onClose={handleCloseDelete}
        aria-labelledby="delete-virtual-profile-title"
      >
        <DialogTitle id="delete-virtual-profile-title">
          {copy.deleteConfirmTitle}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2">
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
