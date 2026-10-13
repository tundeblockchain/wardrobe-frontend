import { validateImageFile, resolveUploadContentType } from "./catalogValidation";
import { ApiError } from "./httpClient";
import type { ResourceApi } from "./resourceApi";
import { UPLOAD_PURPOSE_WARDROBE_ITEM } from "./resourceTypes";
import { putFileToPresignedUrl } from "./uploadToPresignedUrl";

export type UploadAiProfileImageInput = {
  resourceApi: Pick<
    ResourceApi,
    "createUpload" | "createAiProfileUpload" | "attachAiProfileReferenceImages"
  >;
  file: File;
  aiProfileId?: string;
  putFile?: typeof putFileToPresignedUrl;
};

/**
 * Profile photos: POST /uploads (create) or the nested
 * POST /ai-profiles/{id}/uploads (edit), then PUT the presigned URL
 * with only the Content-Type header.
 */
export const uploadAiProfileImage = async ({
  resourceApi,
  file,
  aiProfileId,
  putFile = putFileToPresignedUrl,
}: UploadAiProfileImageInput): Promise<string> => {
  const fileError = validateImageFile(file);
  if (fileError) {
    throw new ApiError({
      status: 400,
      code: "UPLOAD_INVALID",
      message: fileError,
    });
  }

  const contentType = resolveUploadContentType(file);
  const trimmedProfileId = aiProfileId?.trim();

  if (trimmedProfileId) {
    const upload = await resourceApi.createAiProfileUpload(trimmedProfileId, {
      contentType,
      purpose: "AI_PROFILE_REFERENCE",
      contentLength: file.size,
    });

    await putFile({
      uploadUrl: upload.uploadUrl,
      file,
      contentType,
    });

    await resourceApi.attachAiProfileReferenceImages(trimmedProfileId, {
      objectKey: upload.objectKey,
      setAsMain: true,
      replaceMain: true,
    });

    return upload.objectKey;
  }

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
