import { useMemo, useState } from "react";
import { Button } from "@mui/material";
import {
  Link as RouterLink,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { isAtCatalogLimit, isCatalogLimitError } from "../../api/catalogLimits";
import {
  validateOutfitForm,
  type FieldErrors,
  type OutfitFormValues,
} from "../../api/catalogValidation";
import { ApiError, isApiError } from "../../api/httpClient";
import { isNotFoundError, type ResourceApi } from "../../api/resourceApi";
import type { Outfit, Wardrobe } from "../../api/resourceTypes";
import { CatalogLimitPrompt } from "../../components/dashboard/CatalogLimitPrompt";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { OutfitForm } from "../../components/dashboard/OutfitForm";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { dashboardCopy } from "../../content/dashboardCopy";
import { useResourceQuery } from "../../hooks/useResourceQuery";
import { useResourceApi } from "../../api/useResourceApi";
import { appPaths, WARDROBE_ID_QUERY_PARAM } from "../../routes/paths";

export type OutfitFormPageProps = {
  resourceApi?: ResourceApi;
  mode: "create" | "edit";
  outfitId?: string;
  wardrobeId?: string;
};

const loadOutfit = async (
  resourceApi: ResourceApi,
  outfitId: string,
  wardrobeId?: string,
): Promise<Outfit> => {
  const trimmedWardrobeId = wardrobeId?.trim();
  if (trimmedWardrobeId) {
    return resourceApi.getOutfit(trimmedWardrobeId, outfitId);
  }

  const { outfits } = await resourceApi.listOutfits();
  const outfit = outfits.find((entry) => entry.outfitId === outfitId);
  if (!outfit) {
    throw new ApiError({
      status: 404,
      code: "OUTFIT_NOT_FOUND",
      message: "Outfit not found.",
    });
  }

  return outfit;
};

export const OutfitFormPage = ({
  resourceApi: resourceApiProp,
  mode,
  outfitId: outfitIdProp,
  wardrobeId: wardrobeIdProp,
}: OutfitFormPageProps) => {
  const { id: idFromParams } = useParams();
  const [searchParams] = useSearchParams();
  const outfitId = outfitIdProp ?? (mode === "edit" ? idFromParams : "") ?? "";
  const wardrobeIdFromQuery =
    wardrobeIdProp ?? searchParams.get(WARDROBE_ID_QUERY_PARAM) ?? "";
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const meQuery = useResourceQuery("me", resourceApi.getMe);
  const wardrobesQuery = useResourceQuery(
    "wardrobes",
    resourceApi.listWardrobes,
  );
  const loadSelectedOutfit = useMemo(
    () => () => loadOutfit(resourceApi, outfitId, wardrobeIdFromQuery),
    [outfitId, resourceApi, wardrobeIdFromQuery],
  );
  const outfitQuery = useResourceQuery(
    mode === "edit" ? `outfit:${outfitId}:${wardrobeIdFromQuery}` : "outfit:new",
    mode === "edit" ? loadSelectedOutfit : async () => undefined,
  );

  if (
    meQuery.status === "loading" ||
    wardrobesQuery.status === "loading" ||
    outfitQuery.status === "loading"
  ) {
    return (
      <DashboardPage
        headingId="outfit-form-heading"
        title={
          mode === "create"
            ? dashboardCopy.outfitForm.createTitle
            : dashboardCopy.outfitForm.editTitle
        }
        description={
          mode === "create"
            ? dashboardCopy.outfitForm.createDescription
            : dashboardCopy.outfitForm.editDescription
        }
      >
        <ResourceLoadingState label={dashboardCopy.outfitForm.loadingLabel} />
      </DashboardPage>
    );
  }

  if (meQuery.status === "error" || wardrobesQuery.status === "error") {
    const retry =
      meQuery.status === "error" ? meQuery.handleRetry : wardrobesQuery.handleRetry;
    return (
      <DashboardPage
        headingId="outfit-form-heading"
        title={
          mode === "create"
            ? dashboardCopy.outfitForm.createTitle
            : dashboardCopy.outfitForm.editTitle
        }
        description={dashboardCopy.outfitForm.errorDescription}
      >
        <ResourceErrorState
          title={dashboardCopy.outfitForm.errorTitle}
          description={dashboardCopy.outfitForm.errorDescription}
          retryLabel={dashboardCopy.outfits.retryLabel}
          onRetry={retry}
        />
      </DashboardPage>
    );
  }

  if (mode === "edit" && outfitQuery.status === "error") {
    if (isNotFoundError(outfitQuery.error) || outfitId.trim().length === 0) {
      return (
        <DashboardPage
          headingId="outfit-form-heading"
          title={dashboardCopy.outfitForm.notFoundTitle}
          description={dashboardCopy.outfitForm.notFoundDescription}
        >
          <ResourceEmptyState
            title={dashboardCopy.outfitForm.notFoundTitle}
            description={dashboardCopy.outfitForm.notFoundDescription}
          />
        </DashboardPage>
      );
    }

    return (
      <DashboardPage
        headingId="outfit-form-heading"
        title={dashboardCopy.outfitForm.editTitle}
        description={dashboardCopy.outfitForm.errorDescription}
      >
        <ResourceErrorState
          title={dashboardCopy.outfitForm.errorTitle}
          description={dashboardCopy.outfitForm.errorDescription}
          retryLabel={dashboardCopy.outfits.retryLabel}
          onRetry={outfitQuery.handleRetry}
        />
      </DashboardPage>
    );
  }

  if (mode === "create" && isAtCatalogLimit(meQuery.data, "outfit")) {
    return (
      <DashboardPage
        headingId="outfit-form-heading"
        title={dashboardCopy.outfitForm.createTitle}
        description={dashboardCopy.outfitForm.createDescription}
      >
        <CatalogLimitPrompt kind="outfit" />
      </DashboardPage>
    );
  }

  const outfit =
    mode === "edit" && outfitQuery.status === "ready"
      ? outfitQuery.data
      : undefined;

  return (
    <OutfitFormReady
      mode={mode}
      resourceApi={resourceApi}
      wardrobes={wardrobesQuery.data.wardrobes}
      outfit={outfit}
      initialWardrobeId={outfit?.wardrobeId ?? wardrobeIdFromQuery}
    />
  );
};

type OutfitFormReadyProps = {
  mode: "create" | "edit";
  resourceApi: ResourceApi;
  wardrobes: Wardrobe[];
  outfit?: Outfit;
  initialWardrobeId: string;
};

const OutfitFormReady = ({
  mode,
  resourceApi,
  wardrobes,
  outfit,
  initialWardrobeId,
}: OutfitFormReadyProps) => {
  const navigate = useNavigate();
  const copy = dashboardCopy.outfitForm;
  const [values, setValues] = useState<OutfitFormValues>({
    name: outfit?.name ?? "",
    wardrobeId: initialWardrobeId,
    items: outfit?.items.map((entry) => ({ ...entry })) ?? [],
  });
  const [errors, setErrors] = useState<
    FieldErrors<"name" | "wardrobeId" | "items">
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [blockedByLimit, setBlockedByLimit] = useState(false);
  const loadItems = useMemo(
    () => async () => {
      if (!values.wardrobeId.trim()) {
        return { items: [] };
      }

      return resourceApi.listWardrobeItems(values.wardrobeId);
    },
    [resourceApi, values.wardrobeId],
  );
  const itemsQuery = useResourceQuery(
    `wardrobe-items:${values.wardrobeId}`,
    loadItems,
  );

  const handleSubmit = async () => {
    const nextErrors = validateOutfitForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setFormError(undefined);
    try {
      if (mode === "create") {
        await resourceApi.createOutfit(values.wardrobeId, {
          name: values.name.trim(),
          items: values.items,
        });
        navigate(appPaths.appOutfits);
        return;
      }

      if (!outfit) {
        return;
      }

      await resourceApi.updateOutfit(outfit.wardrobeId, outfit.outfitId, {
        name: values.name.trim(),
        items: values.items,
      });
      navigate(appPaths.appOutfits);
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
        headingId="outfit-form-heading"
        title={copy.createTitle}
        description={copy.createDescription}
      >
        <CatalogLimitPrompt kind="outfit" />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      headingId="outfit-form-heading"
      title={mode === "create" ? copy.createTitle : copy.editTitle}
      description={
        mode === "create" ? copy.createDescription : copy.editDescription
      }
      actions={
        <Button
          component={RouterLink}
          to={appPaths.appOutfits}
          variant="text"
          color="secondary"
          tabIndex={0}
          aria-label="Cancel"
        >
          Cancel
        </Button>
      }
    >
      {itemsQuery.status === "error" ? (
        <ResourceErrorState
          title={dashboardCopy.wardrobeDetail.errorTitle}
          description={dashboardCopy.wardrobeDetail.errorDescription}
          retryLabel={dashboardCopy.wardrobeDetail.retryLabel}
          onRetry={itemsQuery.handleRetry}
        />
      ) : (
        <OutfitForm
          values={values}
          errors={errors}
          wardrobes={wardrobes}
          clothingItems={
            itemsQuery.status === "ready" ? itemsQuery.data.items : []
          }
          wardrobeLocked={mode === "edit"}
          isSubmitting={isSubmitting}
          submitLabel={
            mode === "create" ? copy.submitCreateLabel : copy.submitEditLabel
          }
          submittingLabel={copy.submittingLabel}
          formError={formError}
          onValuesChange={setValues}
          onSubmit={() => {
            void handleSubmit();
          }}
        />
      )}
    </DashboardPage>
  );
};
