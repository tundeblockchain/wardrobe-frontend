import { describe, expect, it, vi } from "vitest";
import { isApiError } from "./httpClient";
import { putFileToPresignedUrl } from "./uploadToPresignedUrl";

const UPLOAD_URL = "https://uploads.example.com/presigned/jpg";

describe("putFileToPresignedUrl", () => {
  it("PUTs the file with only the signed Content-Type header", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    const file = new File(["photo"], "tee.jpg", { type: "image/jpeg" });

    await putFileToPresignedUrl({
      uploadUrl: UPLOAD_URL,
      file,
      contentType: "image/jpeg",
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, options] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(UPLOAD_URL);
    expect(options.method).toBe("PUT");
    expect(options.body).toBe(file);
    expect(options.headers).toEqual({ "Content-Type": "image/jpeg" });
    expect(
      (options.headers as Record<string, string>).Authorization,
    ).toBeUndefined();
  });

  it("surfaces a clear upload failure when S3 rejects the PUT", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    });
    const error = await putFileToPresignedUrl({
      uploadUrl: UPLOAD_URL,
      file: new File(["photo"], "tee.jpg", { type: "image/jpeg" }),
      contentType: "image/jpeg",
      fetchImpl: fetchImpl as typeof fetch,
    }).catch((caught: unknown) => caught);

    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({
      status: 403,
      code: "UPLOAD_FAILED",
      message: "The photo could not be uploaded. Try again.",
    });
  });

  it("surfaces a clear upload failure when the PUT cannot be sent", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("Network down"));
    const error = await putFileToPresignedUrl({
      uploadUrl: UPLOAD_URL,
      file: new File(["photo"], "tee.jpg", { type: "image/jpeg" }),
      contentType: "image/jpeg",
      fetchImpl: fetchImpl as typeof fetch,
    }).catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      status: 0,
      code: "UPLOAD_FAILED",
      message: "Network down",
    });
  });
});
