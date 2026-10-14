import { useMemo, useState } from "react";
import { Button } from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { isAtCatalogLimit, isCatalogLimitError } from "../../api/catalogLimits";
import {
  validateWardrobeForm,
  type FieldErrors,
  type WardrobeFormValues,
} from "../../api/catalogValidation";
import { isApiError } from "../../api/httpClient";
import { isNotFoundError, type ResourceApi } from "../../api/resourceApi";
import type { Entitlement, Wardrobe } from "../../api/resourceTypes";
import { CatalogLimitPrompt } from "../../components/dashboard/CatalogLimitPrompt";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { WardrobeForm } from "../../components/dashboard/WardrobeForm";
import { dashboardCopy } from "../../content/dashboardCopy";
import {
  loadUnusedResource,
  useResourceQuery,
} from "../../hooks/useResourceQuery";
import {
  appPaths,
  getAppWardrobePath,
} from "../../routes/paths";
import { useResourceApi } from "../../api/useResourceApi";

export type WardrobeFormPageProps = {
  resourceApi?: ResourceApi;
  mode: "create" | "edit";
  wardrobeId?: string;
};

const EMPTY_VALUES: WardrobeFormValues = { name: "" };

export const WardrobeFormPage = ({
  resourceApi: resourceApiProp,
  mode,
  wardrobeId: wardrobeIdProp,
}: WardrobeFormPageProps) => {
  const { id: wardrobeIdFromParams } = useParams();
  const wardrobeId = wardrobeIdProp ?? wardrobeIdFromParams ?? "";
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const meQuery = useResourceQuery("me", resourceApi.getMe);
  const loadWardrobe = useMemo(
    () => () => resourceApi.getWardrobe(wardrobeId),
    [resourceApi, wardrobeId],
  );
  const wardrobeQuery = useResourceQuery(
    mode === "edit" ? `wardrobe:${wardrobeId}` : "wardrobe:new",
    mode === "edit" ? loadWardrobe : loadUnusedResource,
  );

  if (meQuery.status === "loading" || wardrobeQuery.status === "loading") {
    return (
      <DashboardPage
        headingId="wardrobe-form-heading"
        title={
          mode === "create"
            ? dashboardCopy.wardrobeForm.createTitle
            : dashboardCopy.wardrobeForm.editTitle
        }
        description={
          mode === "create"
            ? dashboardCopy.wardrobeForm.createDescription
            : dashboardCopy.wardrobeForm.editDescription
        }
      >
        <ResourceLoadingState label={dashboardCopy.wardrobeForm.loadingLabel} />
      </DashboardPage>
    );
  }

  if (meQuery.status === "error") {
    return (
      <DashboardPage
        headingId="wardrobe-form-heading"
        title={
          mode === "create"
            ? dashboardCopy.wardrobeForm.createTitle
            : dashboardCopy.wardrobeForm.editTitle
        }
        description={dashboardCopy.wardrobeForm.errorDescription}
      >
        <ResourceErrorState
          title={dashboardCopy.wardrobeForm.errorTitle}
          description={dashboardCopy.wardrobeForm.errorDescription}
          retryLabel={dashboardCopy.wardrobes.retryLabel}
          onRetry={meQuery.handleRetry}
        />
      </DashboardPage>
    );
  }

  if (mode === "edit" && wardrobeQuery.status === "error") {
    if (isNotFoundError(wardrobeQuery.error) || wardrobeId.trim().length === 0) {
      return (
        <DashboardPage
          headingId="wardrobe-form-heading"
          title={dashboardCopy.wardrobeDetail.notFoundTitle}
          description={dashboardCopy.wardrobeDetail.notFoundDescription}
        >
          <ResourceEmptyState
            title={dashboardCopy.wardrobeDetail.notFoundTitle}
            description={dashboardCopy.wardrobeDetail.notFoundDescription}
          />
        </DashboardPage>
      );
    }

    return (
      <DashboardPage
        headingId="wardrobe-form-heading"
        title={dashboardCopy.wardrobeForm.editTitle}
        description={dashboardCopy.wardrobeForm.errorDescription}
      >
        <ResourceErrorState
          title={dashboardCopy.wardrobeForm.errorTitle}
          description={dashboardCopy.wardrobeForm.errorDescription}
          retryLabel={dashboardCopy.wardrobeDetail.retryLabel}
          onRetry={wardrobeQuery.handleRetry}
        />
      </DashboardPage>
    );
  }

  if (mode === "create" && isAtCatalogLimit(meQuery.data, "wardrobe")) {
    return (
      <DashboardPage
        headingId="wardrobe-form-heading"
        title={dashboardCopy.wardrobeForm.createTitle}
        description={dashboardCopy.wardrobeForm.createDescription}
      >
        <CatalogLimitPrompt
          kind="wardrobe"
          limits={meQuery.data.limits}
          usage={meQuery.data.usage}
        />
      </DashboardPage>
    );
  }

  const wardrobe =
    mode === "edit" && wardrobeQuery.status === "ready"
      ? wardrobeQuery.data
      : undefined;

  return (
    <WardrobeFormReady
      mode={mode}
      resourceApi={resourceApi}
      wardrobe={wardrobe}
      entitlement={meQuery.data}
    />
  );
};

type WardrobeFormReadyProps = {
  mode: "create" | "edit";
  resourceApi: ResourceApi;
  wardrobe?: Wardrobe;
  entitlement: Entitlement;
};

const WardrobeFormReady = ({
  mode,
  resourceApi,
  wardrobe,
  entitlement,
}: WardrobeFormReadyProps) => {
  const navigate = useNavigate();
  const copy = dashboardCopy.wardrobeForm;
  const [values, setValues] = useState<WardrobeFormValues>({
    name: wardrobe?.name ?? EMPTY_VALUES.name,
  });
  const [errors, setErrors] = useState<FieldErrors<"name">>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [blockedByLimit, setBlockedByLimit] = useState(false);

  const cancelTo =
    mode === "edit" && wardrobe
      ? getAppWardrobePath(wardrobe.wardrobeId)
      : appPaths.appWardrobes;

  const handleSubmit = async () => {
    const nextErrors = validateWardrobeForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setFormError(undefined);
    try {
      if (mode === "create") {
        const created = await resourceApi.createWardrobe({
          name: values.name.trim(),
        });
        navigate(getAppWardrobePath(created.wardrobeId));
        return;
      }

      if (!wardrobe) {
        return;
      }

      const updated = await resourceApi.updateWardrobe(wardrobe.wardrobeId, {
        name: values.name.trim(),
      });
      navigate(getAppWardrobePath(updated.wardrobeId));
    } catch (error) {
      if (isCatalogLimitError(error)) {
        setBlockedByLimit(true);
        return;
      }

      setFormError(
        isApiError(error) ? error.message : copy.errorDescription,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (blockedByLimit) {
    return (
      <DashboardPage
        headingId="wardrobe-form-heading"
        title={copy.createTitle}
        description={copy.createDescription}
      >
        <CatalogLimitPrompt
          kind="wardrobe"
          limits={entitlement.limits}
          usage={entitlement.usage}
        />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      headingId="wardrobe-form-heading"
      title={mode === "create" ? copy.createTitle : copy.editTitle}
      description={
        mode === "create" ? copy.createDescription : copy.editDescription
      }
      actions={
        <Button
          component={RouterLink}
          to={cancelTo}
          variant="text"
          color="secondary"
          tabIndex={0}
          aria-label="Cancel"
        >
          Cancel
        </Button>
      }
    >
      <WardrobeForm
        values={values}
        errors={errors}
        isSubmitting={isSubmitting}
        submitLabel={mode === "create" ? copy.submitCreateLabel : copy.submitEditLabel}
        submittingLabel={copy.submittingLabel}
        formError={formError}
        onValuesChange={setValues}
        onSubmit={() => {
          void handleSubmit();
        }}
      />
    </DashboardPage>
  );
};
