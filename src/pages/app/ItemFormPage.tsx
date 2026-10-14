import { useMemo, useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { isAtCatalogLimit, isCatalogLimitError } from "../../api/catalogLimits";
import {
  parseColourList,
  validateImageFile,
  validateItemForm,
  type FieldErrors,
  type ItemFormValues,
} from "../../api/catalogValidation";
import { isApiError } from "../../api/httpClient";
import { isNotFoundError, type ResourceApi } from "../../api/resourceApi";
import { getItemImageUrl } from "../../api/resourceDisplay";
import type {
  ClothingItem,
  CreateItemRequest,
  Entitlement,
} from "../../api/resourceTypes";
import { uploadWardrobeItemImage } from "../../api/uploadWardrobeItemImage";
import { putFileToPresignedUrl } from "../../api/uploadToPresignedUrl";
import { CatalogLimitPrompt } from "../../components/dashboard/CatalogLimitPrompt";
import { DashboardPage } from "../../components/dashboard/DashboardPage";
import { ItemForm } from "../../components/dashboard/ItemForm";
import { ResourceEmptyState } from "../../components/dashboard/ResourceEmptyState";
import { ResourceErrorState } from "../../components/dashboard/ResourceErrorState";
import { ResourceLoadingState } from "../../components/dashboard/ResourceLoadingState";
import { dashboardCopy } from "../../content/dashboardCopy";
import {
  loadUnusedResource,
  useResourceQuery,
} from "../../hooks/useResourceQuery";
import { useResourceApi } from "../../api/useResourceApi";
import {
  getAppItemPath,
  getAppWardrobePath,
  WARDROBE_ID_QUERY_PARAM,
} from "../../routes/paths";

export type ItemFormPageProps = {
  resourceApi?: ResourceApi;
  mode: "create" | "edit";
  wardrobeId?: string;
  itemId?: string;
  putFile?: typeof putFileToPresignedUrl;
};

const EMPTY_VALUES: ItemFormValues = {
  name: "",
  category: "",
  subcategory: "",
  colours: "",
  brand: "",
  acquiredAt: "",
};

const valuesFromItem = (item: ClothingItem): ItemFormValues => {
  return {
    name: item.name,
    category: item.category,
    subcategory: item.subcategory ?? "",
    colours: item.colours?.join(", ") ?? "",
    brand: item.brand ?? "",
    acquiredAt: item.acquiredAt ?? "",
  };
};

export const ItemFormPage = ({
  resourceApi: resourceApiProp,
  mode,
  wardrobeId: wardrobeIdProp,
  itemId: itemIdProp,
  putFile = putFileToPresignedUrl,
}: ItemFormPageProps) => {
  const { id: idFromParams } = useParams();
  const [searchParams] = useSearchParams();
  const itemId = itemIdProp ?? (mode === "edit" ? idFromParams : undefined) ?? "";
  const wardrobeId =
    wardrobeIdProp ??
    (mode === "create" ? idFromParams : undefined) ??
    searchParams.get(WARDROBE_ID_QUERY_PARAM) ??
    "";
  const defaultResourceApi = useResourceApi();
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const meQuery = useResourceQuery("me", resourceApi.getMe);
  const loadItem = useMemo(
    () => () => resourceApi.getItem(itemId),
    [itemId, resourceApi],
  );
  const itemQuery = useResourceQuery(
    mode === "edit" ? `item:${itemId}` : "item:new",
    mode === "edit" ? loadItem : loadUnusedResource,
  );

  if (meQuery.status === "loading" || itemQuery.status === "loading") {
    return (
      <DashboardPage
        headingId="item-form-heading"
        title={
          mode === "create"
            ? dashboardCopy.itemForm.createTitle
            : dashboardCopy.itemForm.editTitle
        }
        description={
          mode === "create"
            ? dashboardCopy.itemForm.createDescription
            : dashboardCopy.itemForm.editDescription
        }
      >
        <ResourceLoadingState label={dashboardCopy.itemForm.loadingLabel} />
      </DashboardPage>
    );
  }

  if (meQuery.status === "error") {
    return (
      <DashboardPage
        headingId="item-form-heading"
        title={
          mode === "create"
            ? dashboardCopy.itemForm.createTitle
            : dashboardCopy.itemForm.editTitle
        }
        description={dashboardCopy.itemForm.errorDescription}
      >
        <ResourceErrorState
          title={dashboardCopy.itemForm.errorTitle}
          description={dashboardCopy.itemForm.errorDescription}
          retryLabel={dashboardCopy.itemDetail.retryLabel}
          onRetry={meQuery.handleRetry}
        />
      </DashboardPage>
    );
  }

  if (mode === "edit" && itemQuery.status === "error") {
    if (isNotFoundError(itemQuery.error) || itemId.trim().length === 0) {
      return (
        <DashboardPage
          headingId="item-form-heading"
          title={dashboardCopy.itemDetail.notFoundTitle}
          description={dashboardCopy.itemDetail.notFoundDescription}
        >
          <ResourceEmptyState
            title={dashboardCopy.itemDetail.notFoundTitle}
            description={dashboardCopy.itemDetail.notFoundDescription}
          />
        </DashboardPage>
      );
    }

    return (
      <DashboardPage
        headingId="item-form-heading"
        title={dashboardCopy.itemForm.editTitle}
        description={dashboardCopy.itemForm.errorDescription}
      >
        <ResourceErrorState
          title={dashboardCopy.itemForm.errorTitle}
          description={dashboardCopy.itemForm.errorDescription}
          retryLabel={dashboardCopy.itemDetail.retryLabel}
          onRetry={itemQuery.handleRetry}
        />
      </DashboardPage>
    );
  }

  if (mode === "create" && isAtCatalogLimit(meQuery.data, "item")) {
    return (
      <DashboardPage
        headingId="item-form-heading"
        title={dashboardCopy.itemForm.createTitle}
        description={dashboardCopy.itemForm.createDescription}
      >
        <CatalogLimitPrompt
          kind="item"
          limits={meQuery.data.limits}
          usage={meQuery.data.usage}
          entitlement={meQuery.data}
        />
      </DashboardPage>
    );
  }

  const item =
    mode === "edit" && itemQuery.status === "ready"
      ? itemQuery.data
      : undefined;

  return (
    <ItemFormReady
      mode={mode}
      resourceApi={resourceApi}
      wardrobeId={item?.wardrobeId ?? wardrobeId}
      item={item}
      putFile={putFile}
      entitlement={meQuery.data}
    />
  );
};

type ItemFormReadyProps = {
  mode: "create" | "edit";
  resourceApi: ResourceApi;
  wardrobeId: string;
  item?: ClothingItem;
  putFile: typeof putFileToPresignedUrl;
  entitlement: Entitlement;
};

const ItemFormReady = ({
  mode,
  resourceApi,
  wardrobeId,
  item,
  putFile,
  entitlement,
}: ItemFormReadyProps) => {
  const navigate = useNavigate();
  const copy = dashboardCopy.itemForm;
  const [values, setValues] = useState<ItemFormValues>(
    item ? valuesFromItem(item) : EMPTY_VALUES,
  );
  const [errors, setErrors] = useState<
    FieldErrors<"name" | "category" | "colours" | "acquiredAt" | "image">
  >({});
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    item ? getItemImageUrl(item) : undefined,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [uploadFailed, setUploadFailed] = useState(false);
  const [blockedByLimit, setBlockedByLimit] = useState(false);

  const formTitle = mode === "create" ? copy.createTitle : copy.editTitle;
  const cancelTo = item
    ? getAppItemPath(item.itemId, item.wardrobeId)
    : getAppWardrobePath(wardrobeId);

  const handleCancel = () => {
    navigate(cancelTo);
  };

  const handleFileChange = (file: File | undefined) => {
    if (previewUrl && selectedFile) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setUploadFailed(false);
    setFormError(undefined);
    if (!file) {
      setPreviewUrl(item ? getItemImageUrl(item) : undefined);
      return;
    }

    const fileError = validateImageFile(file);
    setErrors((currentErrors) => ({
      ...currentErrors,
      image: fileError,
    }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    const nextErrors = validateItemForm(values, {
      requireImage: mode === "create",
      hasImage: Boolean(selectedFile || item?.image || item?.originalImageUrl),
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setFormError(undefined);
    setUploadFailed(false);
    try {
      let imageKey: string | undefined;
      if (selectedFile) {
        setIsUploading(true);
        imageKey = await uploadWardrobeItemImage({
          resourceApi,
          file: selectedFile,
          putFile,
        });
        setIsUploading(false);
      }

      const colours = parseColourList(values.colours);
      const subcategory = values.subcategory.trim();
      const brand = values.brand.trim();
      const acquiredAt = values.acquiredAt.trim();

      if (mode === "create") {
        if (!imageKey) {
          setErrors({ image: "A photo is required." });
          return;
        }

        const body: CreateItemRequest = {
          name: values.name.trim(),
          category: values.category as CreateItemRequest["category"],
          imageKey,
        };
        if (subcategory) {
          body.subcategory = subcategory;
        }
        if (colours.length > 0) {
          body.colours = colours;
        }
        if (brand) {
          body.brand = brand;
        }
        if (acquiredAt) {
          body.acquiredAt = acquiredAt;
        }

        const created = await resourceApi.createItem(wardrobeId, body);
        navigate(getAppItemPath(created.itemId, created.wardrobeId));
        return;
      }

      if (!item) {
        return;
      }

      const updated = await resourceApi.updateItem(item.wardrobeId, item.itemId, {
        name: values.name.trim(),
        category: values.category as CreateItemRequest["category"],
        subcategory: subcategory || null,
        colours,
        brand: brand || undefined,
        acquiredAt: acquiredAt || null,
        ...(imageKey ? { imageKey } : {}),
      });
      navigate(getAppItemPath(updated.itemId, updated.wardrobeId));
    } catch (error) {
      if (isCatalogLimitError(error)) {
        setBlockedByLimit(true);
        return;
      }

      if (isApiError(error) && error.code === "UPLOAD_FAILED") {
        setUploadFailed(true);
        setFormError(copy.uploadErrorDescription);
        return;
      }

      setFormError(
        isApiError(error) ? error.message : copy.errorDescription,
      );
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  if (blockedByLimit) {
    return (
      <DashboardPage
        headingId="item-form-heading"
        title={copy.createTitle}
        description={copy.createDescription}
      >
        <CatalogLimitPrompt
          kind="item"
          limits={entitlement.limits}
          usage={entitlement.usage}
          entitlement={entitlement}
        />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      headingId="item-form-heading"
      title={formTitle}
      description={
        mode === "create" ? copy.createDescription : copy.editDescription
      }
    >
      <ItemForm
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
