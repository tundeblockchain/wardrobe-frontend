import type { ChangeEvent } from "react";
import { useState } from "react";
import CheckroomOutlined from "@mui/icons-material/CheckroomOutlined";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getClothingCategoryLabel } from "../../api/resourceDisplay";
import { CLOTHING_CATEGORIES, NAME_MAX_LENGTH } from "../../api/resourceTypes";
import { isApiError } from "../../api/httpClient";
import { uploadWishImage } from "../../api/uploadWishImage";
import { putFileToPresignedUrl } from "../../api/uploadToPresignedUrl";
import { validateImageFile, type FieldErrors } from "../../api/catalogValidation";
import {
  EMPTY_WISH_FORM_VALUES,
  WISH_CURRENCIES,
  WISH_LINK_MAX_LENGTH,
  WISH_NOTES_MAX_LENGTH,
  getWishImageUrl,
  isUploadInvalidError,
  isWishlistLimitError,
  toCreateWishRequest,
  toUpdateWishRequest,
  validateWishForm,
  valuesFromWish,
  type WishFormField,
  type WishFormValues,
  type WishItem,
  type WishlistApi,
} from "../../api/wishlistApi";
import { trackEvent } from "../../config/trackingEvents";
import { dashboardCopy } from "../../content/dashboardCopy";
import { ResourceImage } from "./ResourceImage";

export type WishListFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  wish?: WishItem;
  wishlistApi: WishlistApi;
  putFile?: typeof putFileToPresignedUrl;
  onClose: () => void;
  onSaved: (wish: WishItem) => void;
};

export const WishListFormDialog = ({
  open,
  mode,
  wish,
  wishlistApi,
  putFile = putFileToPresignedUrl,
  onClose,
  onSaved,
}: WishListFormDialogProps) => {
  const copy = dashboardCopy.wishList;
  const [values, setValues] = useState<WishFormValues>(
    wish ? valuesFromWish(wish) : EMPTY_WISH_FORM_VALUES,
  );
  const [errors, setErrors] = useState<FieldErrors<WishFormField>>({});
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    wish ? getWishImageUrl(wish) : undefined,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [capMessage, setCapMessage] = useState<string | undefined>();

  const title = mode === "create" ? copy.createTitle : copy.editTitle;
  const submitLabel = mode === "create" ? copy.submitCreateLabel : copy.submitEditLabel;
  const isBusy = isSubmitting || isUploading;
  const busyLabel = isUploading ? copy.uploadingLabel : copy.submittingLabel;

  const handleClose = () => {
    if (isBusy) {
      return;
    }

    onClose();
  };

  const handleFieldChange =
    (field: keyof WishFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues({
        ...values,
        [field]: event.target.value,
      });
    };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (previewUrl && selectedFile) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setFormError(undefined);
    if (!file) {
      setPreviewUrl(wish ? getWishImageUrl(wish) : undefined);
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
    const nextErrors = validateWishForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setFormError(undefined);
    setCapMessage(undefined);
    try {
      let imageKey: string | undefined;
      if (selectedFile) {
        setIsUploading(true);
        imageKey = await uploadWishImage({
          wishlistApi,
          file: selectedFile,
          putFile,
        });
        setIsUploading(false);
      }

      const saved =
        mode === "edit" && wish
          ? await wishlistApi.updateWish(
              wish.wishId,
              toUpdateWishRequest(values, imageKey),
            )
          : await wishlistApi.createWish(toCreateWishRequest(values, imageKey));
      if (mode !== "edit") {
        trackEvent("add_to_wishlist");
      }
      onSaved(saved);
    } catch (error) {
      if (isWishlistLimitError(error)) {
        setCapMessage(error.message || copy.capMessage);
        return;
      }

      if (isUploadInvalidError(error) || (isApiError(error) && error.code === "UPLOAD_FAILED")) {
        setFormError(
          `${copy.uploadErrorTitle}. ${copy.uploadErrorDescription}`,
        );
        return;
      }

      setFormError(
        isApiError(error) ? error.message : copy.saveErrorFallback,
      );
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="wish-list-form-title"
    >
      <DialogTitle id="wish-list-form-title">{title}</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          spacing={2}
          sx={{ mt: 1 }}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          {capMessage ? (
            <Alert severity="info" role="status">
              {capMessage}
            </Alert>
          ) : null}
          {formError ? (
            <Alert severity="error" role="alert">
              {formError}
            </Alert>
          ) : null}
          <Box
            sx={{
              height: 200,
              border: 1,
              borderColor: errors.image ? "error.main" : "divider",
              overflow: "hidden",
            }}
          >
            <ResourceImage
              imageUrl={previewUrl}
              alt={values.name.trim() || copy.imageLabel}
              fallbackLabel={copy.imageEmpty}
              FallbackIcon={CheckroomOutlined}
            />
          </Box>
          <Stack spacing={1}>
            <Button
              component="label"
              variant="outlined"
              color="secondary"
              tabIndex={0}
              aria-label={
                previewUrl ? copy.imageReplaceLabel : copy.imageChooseLabel
              }
            >
              {previewUrl ? copy.imageReplaceLabel : copy.imageChooseLabel}
              <input
                type="file"
                hidden
                accept="image/jpeg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp,.heic"
                onChange={handleFileChange}
                aria-label={copy.imageLabel}
              />
            </Button>
            {errors.image ? (
              <Typography variant="caption" color="error">
                {errors.image}
              </Typography>
            ) : null}
          </Stack>
          <TextField
            id="wish-name"
            name="name"
            label={copy.nameLabel}
            value={values.name}
            onChange={handleFieldChange("name")}
            error={Boolean(errors.name)}
            helperText={errors.name}
            required
            autoComplete="off"
            slotProps={{
              htmlInput: {
                "aria-label": copy.nameLabel,
                maxLength: NAME_MAX_LENGTH,
              },
            }}
          />
          <TextField
            id="wish-category"
            name="category"
            label={copy.categoryLabel}
            value={values.category}
            onChange={handleFieldChange("category")}
            error={Boolean(errors.category)}
            helperText={errors.category}
            select
            slotProps={{
              htmlInput: { "aria-label": copy.categoryLabel },
            }}
          >
            <MenuItem value="">
              {copy.notSetLabel}
            </MenuItem>
            {CLOTHING_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {getClothingCategoryLabel(category)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            id="wish-subcategory"
            name="subcategory"
            label={copy.subcategoryLabel}
            value={values.subcategory}
            onChange={handleFieldChange("subcategory")}
            autoComplete="off"
            slotProps={{
              htmlInput: { "aria-label": copy.subcategoryLabel },
            }}
          />
          <TextField
            id="wish-link"
            name="link"
            label={copy.linkLabel}
            value={values.link}
            onChange={handleFieldChange("link")}
            error={Boolean(errors.link)}
            helperText={errors.link}
            autoComplete="url"
            slotProps={{
              htmlInput: {
                "aria-label": copy.linkLabel,
                maxLength: WISH_LINK_MAX_LENGTH,
              },
            }}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              id="wish-price"
              name="price"
              label={copy.priceLabel}
              value={values.price}
              onChange={handleFieldChange("price")}
              error={Boolean(errors.price)}
              helperText={errors.price}
              type="number"
              slotProps={{
                htmlInput: {
                  "aria-label": copy.priceLabel,
                  min: 0,
                  step: "0.01",
                },
              }}
              sx={{ flex: 1 }}
            />
            <TextField
              id="wish-currency"
              name="currency"
              label={copy.currencyLabel}
              value={values.currency}
              onChange={handleFieldChange("currency")}
              error={Boolean(errors.currency)}
              helperText={errors.currency}
              select
              slotProps={{
                htmlInput: { "aria-label": copy.currencyLabel },
              }}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">{copy.notSetLabel}</MenuItem>
              {WISH_CURRENCIES.map((currency) => (
                <MenuItem key={currency} value={currency}>
                  {currency}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField
            id="wish-notes"
            name="notes"
            label={copy.notesLabel}
            value={values.notes}
            onChange={handleFieldChange("notes")}
            error={Boolean(errors.notes)}
            helperText={errors.notes}
            multiline
            minRows={3}
            autoComplete="off"
            slotProps={{
              htmlInput: {
                "aria-label": copy.notesLabel,
                maxLength: WISH_NOTES_MAX_LENGTH,
              },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          type="button"
          color="secondary"
          onClick={handleClose}
          tabIndex={0}
          aria-label={copy.cancelLabel}
          disabled={isBusy}
        >
          {copy.cancelLabel}
        </Button>
        <Button
          type="button"
          variant="contained"
          color="primary"
          onClick={() => {
            void handleSubmit();
          }}
          tabIndex={0}
          aria-label={isBusy ? busyLabel : submitLabel}
          disabled={isBusy}
        >
          {isBusy ? busyLabel : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
