import { describe, expect, it, vi } from "vitest";
import { createMockResourceApi } from "./mockResourceApi";
import { uploadWardrobeItemImage } from "./uploadWardrobeItemImage";

describe("uploadWardrobeItemImage", () => {
  it("asks POST /uploads for the file type then PUTs that same type", async () => {
    const createUpload = vi.fn().mockResolvedValue({
      uploadUrl: "https://uploads.example.com/presigned/jpg",
      objectKey: "users/user-1/uploads/upl_1.jpg",
      expiresIn: 900,
    });
    const putFile = vi.fn().mockResolvedValue(undefined);
    const file = new File(["photo"], "tee.jpg", { type: "image/jpeg" });

    await expect(
      uploadWardrobeItemImage({
        resourceApi: { createUpload },
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

  it("rejects an invalid file before calling /uploads", async () => {
    const api = createMockResourceApi();
    const createUpload = vi.spyOn(api, "createUpload");

    await expect(
      uploadWardrobeItemImage({
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
