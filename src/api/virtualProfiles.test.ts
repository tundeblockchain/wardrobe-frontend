import { describe, expect, it, vi } from "vitest";
import { ApiError } from "./httpClient";
import { ENTITLEMENT_AI_REQUIRED_CODE } from "./resourceTypes";
import type { AiProfile } from "./resourceTypes";
import {
  loadListedVirtualProfiles,
  mergeVirtualProfiles,
} from "./virtualProfiles";

const personal: AiProfile = {
  aiProfileId: "aip_personal01",
  type: "PERSONAL",
  referenceImages: [],
  status: "READY",
  createdAt: "2026-09-01T12:00:00.000Z",
  updatedAt: "2026-09-01T12:00:00.000Z",
  label: "Weekday look",
};

const preset: AiProfile = {
  aiProfileId: "aip_model01",
  type: "GENERIC_MODEL",
  referenceImages: [],
  status: "READY",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  label: "Catalog model",
};

describe("virtualProfiles", () => {
  it("lists personal Virtual Profiles before presets and drops duplicates", () => {
    expect(mergeVirtualProfiles([personal], [preset, personal])).toEqual([
      personal,
      preset,
    ]);
  });

  it("loads own profiles next to the ungated preset catalog", async () => {
    const listAiProfiles = vi.fn().mockResolvedValue({
      aiProfiles: [personal],
    });
    const listGenericAiProfiles = vi.fn().mockResolvedValue({
      aiProfiles: [preset],
    });

    await expect(
      loadListedVirtualProfiles({ listAiProfiles, listGenericAiProfiles }),
    ).resolves.toEqual([personal, preset]);
    expect(listGenericAiProfiles).toHaveBeenCalledTimes(1);
    expect(listAiProfiles).toHaveBeenCalledTimes(1);
  });

  it("keeps presets when personal profiles are Premium-gated", async () => {
    const listAiProfiles = vi.fn().mockRejectedValue(
      new ApiError({
        status: 403,
        code: ENTITLEMENT_AI_REQUIRED_CODE,
        message: "Premium is required for Virtual Profiles.",
      }),
    );
    const listGenericAiProfiles = vi.fn().mockResolvedValue({
      aiProfiles: [preset],
    });

    await expect(
      loadListedVirtualProfiles({ listAiProfiles, listGenericAiProfiles }),
    ).resolves.toEqual([preset]);
  });

  it("rethrows unexpected personal-profile errors", async () => {
    const listAiProfiles = vi.fn().mockRejectedValue(
      new ApiError({
        status: 500,
        code: "INTERNAL",
        message: "Server error",
      }),
    );
    const listGenericAiProfiles = vi.fn().mockResolvedValue({
      aiProfiles: [preset],
    });

    await expect(
      loadListedVirtualProfiles({ listAiProfiles, listGenericAiProfiles }),
    ).rejects.toMatchObject({ code: "INTERNAL" });
  });
});
