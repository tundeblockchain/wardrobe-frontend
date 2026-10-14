import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  canUseAiTryOn,
  canUseOtherAi,
  getCatalogKindForLimitCode,
  getForbiddenUpgradeKind,
} from "../../api/entitlementGating";
import {
  validateImageFile,
  validateVirtualProfileForm,
  type FieldErrors,
  type VirtualProfileFormValues,
} from "../../api/catalogValidation";
import { isApiError } from "../../api/httpClient";
import { isNotFoundError, type ResourceApi } from "../../api/resourceApi";
import {
  getAiProfileImageUrl,
  isOwnedPersonalVirtualProfile,
} from "../../api/resourceDisplay";
import type { AiProfile, Entitlement } from "../../api/resourceTypes";
import { uploadAiProfileImage } from "../../api/uploadAiProfileImage";
import { putFileToPresignedUrl } from "../../api/uploadToPresignedUrl";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ForbiddenUpgradePrompt } from "../../components/dashboard/ForbiddenUpgradePrompt";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { VirtualProfileForm } from "../../components/dashboard/VirtualProfileForm";
import { dashboardCopy } from "../../content/dashboardCopy";
import {
  loadUnusedResource,
  useResourceQuery,
} from "../../hooks/useResourceQuery";
import { useResourceApi } from "../../api/useResourceApi";
import { appPaths } from "../../routes/paths";

export type VirtualProfileFormPageProps = {
  resourceApi?: ResourceApi;
  mode: "create" | "edit";
  aiProfileId?: string;
  putFile?: typeof putFileToPresignedUrl;
};

const EMPTY_VALUES: VirtualProfileFormValues = {
  label: "",
  notes: "",
};

const valuesFromProfile = (profile: AiProfile): VirtualProfileFormValues => {
  return {
    label: profile.label ?? "",
    notes: profile.notes ?? "",
  };
};

export const VirtualProfileFormPage = ({
  resourceApi: resourceApiProp,
  mode,
  aiProfileId: aiProfileIdProp,
  putFile = putFileToPresignedUrl,
}: VirtualProfileFormPageProps) => {
  const { id: idFromParams } = useParams();
  const aiProfileId =
    aiProfileIdProp ?? (mode === "edit" ? idFromParams : undefined) ?? "";
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const meQuery = useResourceQuery("me", resourceApi.getMe);
  const loadProfile = useMemo(
    () => () => resourceApi.getAiProfile(aiProfileId),
    [aiProfileId, resourceApi],
  );
  const profileQuery = useResourceQuery(
    mode === "edit" ? `virtual-profile:${aiProfileId}` : "virtual-profile:new",
    mode === "edit" ? loadProfile : loadUnusedResource,
  );
  const copy = dashboardCopy.virtualProfileForm;

  if (meQuery.status === "loading" || profileQuery.status === "loading") {
    return (
      <DashboardPage
        headingId="virtual-profile-form-heading"
        title={mode === "create" ? copy.createTitle : copy.editTitle}
        description={
          mode === "create" ? copy.createDescription : copy.editDescription
        }
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
          headingId="virtual-profile-form-heading"
          title={mode === "create" ? copy.createTitle : copy.editTitle}
          description={copy.errorDescription}
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
        headingId="virtual-profile-form-heading"
        title={mode === "create" ? copy.createTitle : copy.editTitle}
        description={copy.errorDescription}
      >
        <ResourceErrorState
          title={copy.errorTitle}
          description={copy.errorDescription}
          retryLabel={dashboardCopy.virtualProfiles.retryLabel}
          onRetry={meQuery.handleRetry}
        />
      </DashboardPage>
    );
  }

  if (!canUseAiTryOn(meQuery.data) || !canUseOtherAi(meQuery.data)) {
    return (
      <DashboardPage
        headingId="virtual-profile-form-heading"
        title={mode === "create" ? copy.createTitle : copy.editTitle}
        description={
          mode === "create" ? copy.createDescription : copy.editDescription
        }
      >
        <ForbiddenUpgradePrompt
          kind="premium"
          entitlement={meQuery.data}
          premiumTitle={dashboardCopy.virtualProfiles.otherAiTitle}
          premiumDescription={dashboardCopy.virtualProfiles.otherAiDescription}
          premiumActionAriaLabel={
            dashboardCopy.virtualProfiles.otherAiActionAriaLabel
          }
        />
      </DashboardPage>
    );
  }

  if (mode === "edit" && profileQuery.status === "error") {
    const upgradeKind = getForbiddenUpgradeKind(profileQuery.error);
    if (upgradeKind) {
      return (
        <DashboardPage
          headingId="virtual-profile-form-heading"
          title={copy.editTitle}
          description={copy.errorDescription}
        >
          <ForbiddenUpgradePrompt
            kind={upgradeKind}
            catalogKind={getCatalogKindForLimitCode(profileQuery.error.code)}
          />
        </DashboardPage>
      );
    }

    if (isNotFoundError(profileQuery.error) || aiProfileId.trim().length === 0) {
      return (
        <DashboardPage
          headingId="virtual-profile-form-heading"
          title={copy.notFoundTitle}
          description={copy.notFoundDescription}
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
        headingId="virtual-profile-form-heading"
        title={copy.editTitle}
        description={copy.errorDescription}
      >
        <ResourceErrorState
          title={copy.errorTitle}
          description={copy.errorDescription}
          retryLabel={dashboardCopy.virtualProfiles.retryLabel}
          onRetry={profileQuery.handleRetry}
        />
      </DashboardPage>
    );
  }

  const profile =
    mode === "edit" && profileQuery.status === "ready"
      ? profileQuery.data
      : undefined;

  if (mode === "edit" && profile && !isOwnedPersonalVirtualProfile(profile)) {
    return (
      <DashboardPage
        headingId="virtual-profile-form-heading"
        title={copy.notFoundTitle}
        description={copy.notFoundDescription}
      >
        <ResourceEmptyState
          title={copy.notFoundTitle}
          description={copy.notFoundDescription}
        />
      </DashboardPage>
    );
  }

  return (
    <VirtualProfileFormReady
      mode={mode}
      resourceApi={resourceApi}
      profile={profile}
      putFile={putFile}
      entitlement={meQuery.data}
    />
  );
};

type VirtualProfileFormReadyProps = {
  mode: "create" | "edit";
  resourceApi: ResourceApi;
  profile?: AiProfile;
  putFile: typeof putFileToPresignedUrl;
  entitlement: Entitlement;
};

const VirtualProfileFormReady = ({
  mode,
  resourceApi,
  profile,
  putFile,
  entitlement,
}: VirtualProfileFormReadyProps) => {
  const navigate = useNavigate();
  const copy = dashboardCopy.virtualProfileForm;
  const [values, setValues] = useState<VirtualProfileFormValues>(
    profile ? valuesFromProfile(profile) : EMPTY_VALUES,
  );
  const [errors, setErrors] = useState<FieldErrors<"label" | "notes" | "image">>(
    {},
  );
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    profile ? getAiProfileImageUrl(profile) : undefined,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [uploadFailed, setUploadFailed] = useState(false);
  const [upgradeKind, setUpgradeKind] = useState<
    ReturnType<typeof getForbiddenUpgradeKind>
  >(undefined);

  const formTitle = mode === "create" ? copy.createTitle : copy.editTitle;

  const handleCancel = () => {
    navigate(appPaths.appVirtualProfiles);
  };

  const handleFileChange = (file: File | undefined) => {
    if (previewUrl && selectedFile) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setUploadFailed(false);
    setFormError(undefined);
    if (!file) {
      setPreviewUrl(profile ? getAiProfileImageUrl(profile) : undefined);
      return;
    }

    const fileError = file ? validateImageFile(file) : undefined;
    setErrors((currentErrors) => ({
      ...currentErrors,
      image: fileError,
    }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    const nextErrors = validateVirtualProfileForm(values, {
      requireImage: mode === "create",
      hasImage: Boolean(
        selectedFile || profile?.frontImageUrl || profile?.referenceImages.length,
      ),
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setFormError(undefined);
    setUploadFailed(false);
    try {
      if (mode === "create") {
        let imageKey: string | undefined;
        if (selectedFile) {
          setIsUploading(true);
          imageKey = await uploadAiProfileImage({
            resourceApi,
            file: selectedFile,
            putFile,
          });
          setIsUploading(false);
        }

        await resourceApi.createAiProfile({
          type: "PERSONAL",
          label: values.label.trim() || undefined,
          notes: values.notes.trim() || undefined,
          referenceImages: imageKey ? [imageKey] : undefined,
        });
        navigate(appPaths.appVirtualProfiles);
        return;
      }

      if (!profile || !isOwnedPersonalVirtualProfile(profile)) {
        return;
      }

      if (selectedFile) {
        setIsUploading(true);
        await uploadAiProfileImage({
          resourceApi,
          file: selectedFile,
          aiProfileId: profile.aiProfileId,
          putFile,
        });
        setIsUploading(false);
      }

      await resourceApi.updateAiProfile(profile.aiProfileId, {
        label: values.label.trim() || null,
        notes: values.notes.trim() || null,
      });
      navigate(appPaths.appVirtualProfiles);
    } catch (error) {
      const nextUpgrade = getForbiddenUpgradeKind(error);
      if (nextUpgrade) {
        setUpgradeKind(nextUpgrade);
        return;
      }

      if (isApiError(error) && error.code === "UPLOAD_FAILED") {
        setUploadFailed(true);
        setFormError(copy.uploadErrorDescription);
        return;
      }

      setFormError(isApiError(error) ? error.message : copy.errorDescription);
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  if (upgradeKind) {
    return (
      <DashboardPage
        headingId="virtual-profile-form-heading"
        title={mode === "create" ? copy.createTitle : copy.editTitle}
        description={
          mode === "create" ? copy.createDescription : copy.editDescription
        }
      >
        <ForbiddenUpgradePrompt
          kind={upgradeKind}
          entitlement={entitlement}
          premiumTitle={dashboardCopy.virtualProfiles.otherAiTitle}
          premiumDescription={dashboardCopy.virtualProfiles.otherAiDescription}
          premiumActionAriaLabel={
            dashboardCopy.virtualProfiles.otherAiActionAriaLabel
          }
        />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      headingId="virtual-profile-form-heading"
      title={formTitle}
      description={
        mode === "create" ? copy.createDescription : copy.editDescription
      }
    >
      <VirtualProfileForm
        title={formTitle}
        values={values}
        errors={errors}
        isSubmitting={isSubmitting}
        isUploading={isUploading}
        submitLabel={
          mode === "create" ? copy.submitCreateLabel : copy.submitEditLabel
        }
        submittingLabel={copy.submittingLabel}
        uploadingLabel={copy.uploadingLabel}
        imagePreviewUrl={previewUrl}
        formError={
          uploadFailed
            ? `${copy.uploadErrorTitle}. ${copy.uploadErrorDescription}`
            : formError
        }
        onCancel={handleCancel}
        onValuesChange={setValues}
        onFileChange={handleFileChange}
        onSubmit={() => {
          void handleSubmit();
        }}
      />
    </DashboardPage>
  );
};
