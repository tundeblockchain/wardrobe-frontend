import { ApiError } from "./httpClient";

export const UPLOAD_FAILED_CODE = "UPLOAD_FAILED";

export type PutFileToPresignedUrlInput = {
  uploadUrl: string;
  file: Blob;
  contentType: string;
  fetchImpl?: typeof fetch;
};

/**
 * Browser PUT to the presigned S3 URL from POST /uploads.
 * Sends only Content-Type, matching the value used to sign the URL.
 * Do not attach Authorization or any other headers.
 */
export const putFileToPresignedUrl = async ({
  uploadUrl,
  file,
  contentType,
  fetchImpl = fetch,
}: PutFileToPresignedUrlInput): Promise<void> => {
  let response: Response;
  try {
    response = await fetchImpl(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: file,
    });
  } catch (error) {
    throw new ApiError({
      status: 0,
      code: UPLOAD_FAILED_CODE,
      message:
        error instanceof Error
          ? error.message
          : "The photo could not be uploaded. Try again.",
    });
  }

  if (response.ok) {
    return;
  }

  throw new ApiError({
    status: response.status,
    code: UPLOAD_FAILED_CODE,
    message: "The photo could not be uploaded. Try again.",
  });
};
