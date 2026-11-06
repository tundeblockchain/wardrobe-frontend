import { validateImageFile, resolveUploadContentType } from "./catalogValidation";
import { ApiError } from "./httpClient";
import {
  UPLOAD_INVALID_CODE,
  UPLOAD_PURPOSE_WISHLIST,
  type WishlistApi,
} from "./wishlistApi";
import { putFileToPresignedUrl } from "./uploadToPresignedUrl";

export type UploadWishImageInput = {
  wishlistApi: Pick<WishlistApi, "createUpload">;
  file: File;
  putFile?: typeof putFileToPresignedUrl;
};

export const uploadWishImage = async ({
  wishlistApi,
  file,
  putFile = putFileToPresignedUrl,
}: UploadWishImageInput): Promise<string> => {
  const fileError = validateImageFile(file);
  if (fileError) {
    throw new ApiError({
      status: 400,
      code: UPLOAD_INVALID_CODE,
      message: fileError,
    });
  }

  const contentType = resolveUploadContentType(file);
  const upload = await wishlistApi.createUpload({
    contentType,
    purpose: UPLOAD_PURPOSE_WISHLIST,
    contentLength: file.size,
  });

  await putFile({
    uploadUrl: upload.uploadUrl,
    file,
    contentType,
  });

  return upload.objectKey;
};
