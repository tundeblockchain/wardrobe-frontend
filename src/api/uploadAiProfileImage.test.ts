import { describe, expect, it, vi } from "vitest";
import { createMockResourceApi } from "./mockResourceApi";
import { uploadAiProfileImage } from "./uploadAiProfileImage";

describe("uploadAiProfileImage", () => {
  it("uses POST /uploads then PUTs the same Content-Type on create", async () => {
    const createUpload = vi.fn().mockResolvedValue({
      uploadUrl: "https://uploads.example.com/presigned/jpg",
      objectKey: "users/user-1/uploads/upl_1.jpg",
      expiresIn: 900,
    });
    const putFile = vi.fn().mockResolvedValue(undefined);
    const file = new File(["photo"], "profile.jpg", { type: "image/jpeg" });

    await expect(
      uploadAiProfileImage({
        resourceApi: {
          createUpload,
          createAiProfileUpload: vi.fn(),
          attachAiProfileReferenceImages: vi.fn(),
        },
        file,
        putFile,
      }),
    ).resolves.toBe("users/user-1/uploads/upl_1.jpg");

    expect(createUpload).toHaveBeenCalledWith({
      contentType: "image/jpeg",
      purpose: "WARDROBE_ITEM",
      contentLength: file.size,
    });
    expect(putFile).toHaveBeenCalledWith({
      uploadUrl: "https://uploads.example.com/presigned/jpg",
      file,
      contentType: "image/jpeg",
    });
  });

  it("uses the nested Virtual Profile upload route when editing", async () => {
    const createAiProfileUpload = vi.fn().mockResolvedValue({
      uploadUrl: "https://uploads.example.com/presigned/profile.jpg",
      objectKey: "users/user-1/ai-profiles/aip_1/upl_1.jpg",
      expiresIn: 900,
    });
    const attachAiProfileReferenceImages = vi.fn().mockResolvedValue({});
    const putFile = vi.fn().mockResolvedValue(undefined);
    const file = new File(["photo"], "profile.png", { type: "image/png" });

    await expect(
      uploadAiProfileImage({
        resourceApi: {
          createUpload: vi.fn(),
          createAiProfileUpload,
          attachAiProfileReferenceImages,
        },
        file,
        aiProfileId: "aip_1",
        putFile,
      }),
    ).resolves.toBe("users/user-1/ai-profiles/aip_1/upl_1.jpg");

    expect(createAiProfileUpload).toHaveBeenCalledWith("aip_1", {
      contentType: "image/png",
      purpose: "AI_PROFILE_REFERENCE",
      contentLength: file.size,
    });
    expect(putFile).toHaveBeenCalledWith({
      uploadUrl: "https://uploads.example.com/presigned/profile.jpg",
      file,
      contentType: "image/png",
    });
    expect(attachAiProfileReferenceImages).toHaveBeenCalledWith("aip_1", {
      objectKey: "users/user-1/ai-profiles/aip_1/upl_1.jpg",
      setAsMain: true,
      replaceMain: true,
    });
  });

  it("rejects an invalid file before calling /uploads", async () => {
    const api = createMockResourceApi();
    const createUpload = vi.spyOn(api, "createUpload");

    await expect(
      uploadAiProfileImage({
        resourceApi: api,
        file: new File(["x"], "notes.txt", { type: "text/plain" }),
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "UPLOAD_INVALID",
    });
    expect(createUpload).not.toHaveBeenCalled();
  });
});
