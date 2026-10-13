import { validateImageFile, resolveUploadContentType } from "./catalogValidation";
import { ApiError } from "./httpClient";
import type { ResourceApi } from "./resourceApi";
import { UPLOAD_PURPOSE_WARDROBE_ITEM } from "./resourceTypes";
import { putFileToPresignedUrl } from "./uploadToPresignedUrl";

export type UploadWardrobeItemImageInput = {
  resourceApi: Pick<ResourceApi, "createUpload">;
  file: File;
  putFile?: typeof putFileToPresignedUrl;
};

export const uploadWardrobeItemImage = async ({
  resourceApi,
  file,
  putFile = putFileToPresignedUrl,
}: UploadWardrobeItemImageInput): Promise<string> => {
  const fileError = validateImageFile(file);
  if (fileError) {
    throw new ApiError({
      status: 400,
      code: "UPLOAD_INVALID",
      message: fileError,
    });
  }

  const contentType = resolveUploadContentType(file);
  const upload = await resourceApi.createUpload({
    contentType,
    purpose: UPLOAD_PURPOSE_WARDROBE_ITEM,
    contentLength: file.size,
  });

  await putFile({
    uploadUrl: upload.uploadUrl,
    file,
    contentType,
  });

  return upload.objectKey;
};
