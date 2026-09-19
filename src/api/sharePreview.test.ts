import { describe, expect, it, vi } from "vitest";
import {
  fetchSharePreview,
  getPublicSharePreviewUrl,
  getShareResourceTypeLabel,
  parseSharePreview,
} from "./sharePreview";

const validPreview = {
  resourceType: "OUTFIT",
  title: "Weekend brunch",
  imageUrl: "https://cdn.example.com/outfit.jpg",
  expiresAt: "2026-10-19T12:00:00.000Z",
};

describe("share preview helpers", () => {
  it("builds the public preview URL from the API base and token", () => {
    expect(
      getPublicSharePreviewUrl("https://api.example.com", "shr_abcdefghijklmnopqrstu"),
    ).toBe("https://api.example.com/public/shares/shr_abcdefghijklmnopqrstu");
  });

  it("encodes tokens in the public preview URL", () => {
    expect(getPublicSharePreviewUrl("https://api.example.com", "shr a/b")).toBe(
      "https://api.example.com/public/shares/shr%20a%2Fb",
    );
  });

  it("labels ITEM and OUTFIT types for the card", () => {
    expect(getShareResourceTypeLabel("ITEM")).toBe("Item");
    expect(getShareResourceTypeLabel("OUTFIT")).toBe("Outfit");
  });

  it("soft-omits a missing image URL when parsing a preview", () => {
    const preview = parseSharePreview({
      resourceType: "ITEM",
      title: "Black T-Shirt",
      expiresAt: "2026-10-19T12:00:00.000Z",
    });

    expect(preview).toEqual({
      resourceType: "ITEM",
      title: "Black T-Shirt",
      expiresAt: "2026-10-19T12:00:00.000Z",
    });
    expect(preview).not.toHaveProperty("imageUrl");
  });

  it("rejects incomplete or invalid preview payloads", () => {
    expect(parseSharePreview(null)).toBeUndefined();
    expect(parseSharePreview({ resourceType: "WARDROBE", title: "X" })).toBeUndefined();
    expect(
      parseSharePreview({
        resourceType: "ITEM",
        title: "   ",
        expiresAt: "2026-10-19T12:00:00.000Z",
      }),
    ).toBeUndefined();
  });
});

describe("fetchSharePreview", () => {
  it("returns not_found when the token is blank", async () => {
    const fetchImpl = vi.fn();

    await expect(
      fetchSharePreview({
        apiBaseUrl: "https://api.example.com",
        token: "  ",
        fetchImpl,
      }),
    ).resolves.toEqual({ status: "not_found" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns misconfigured when the API base is missing", async () => {
    const fetchImpl = vi.fn();

    await expect(
      fetchSharePreview({
        apiBaseUrl: undefined,
        token: "shr_abcdefghijklmnopqrstu",
        fetchImpl,
      }),
    ).resolves.toEqual({ status: "misconfigured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns a parsed preview on 200", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => validPreview,
    });

    await expect(
      fetchSharePreview({
        apiBaseUrl: "https://api.example.com",
        token: "shr_abcdefghijklmnopqrstu",
        fetchImpl,
      }),
    ).resolves.toEqual({ status: "ok", preview: validPreview });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example.com/public/shares/shr_abcdefghijklmnopqrstu",
      {
        method: "GET",
        headers: { Accept: "application/json" },
      },
    );
  });

  it("maps 404 and 410 to share error states", async () => {
    const notFoundFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });
    const goneFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 410,
    });

    await expect(
      fetchSharePreview({
        apiBaseUrl: "https://api.example.com",
        token: "shr_missingtoken0000001",
        fetchImpl: notFoundFetch,
      }),
    ).resolves.toEqual({ status: "not_found" });
    await expect(
      fetchSharePreview({
        apiBaseUrl: "https://api.example.com",
        token: "shr_expiredtoken00000001",
        fetchImpl: goneFetch,
      }),
    ).resolves.toEqual({ status: "gone" });
  });

  it("maps network failures and invalid 200 bodies to network", async () => {
    const thrownFetch = vi.fn().mockRejectedValue(new Error("offline"));
    const invalidFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ resourceType: "ITEM" }),
    });

    await expect(
      fetchSharePreview({
        apiBaseUrl: "https://api.example.com",
        token: "shr_abcdefghijklmnopqrstu",
        fetchImpl: thrownFetch,
      }),
    ).resolves.toEqual({ status: "network" });
    await expect(
      fetchSharePreview({
        apiBaseUrl: "https://api.example.com",
        token: "shr_abcdefghijklmnopqrstu",
        fetchImpl: invalidFetch,
      }),
    ).resolves.toEqual({ status: "network" });
  });
});
