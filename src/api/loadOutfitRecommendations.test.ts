import { describe, expect, it, vi } from "vitest";
import { loadOutfitRecommendations } from "./loadOutfitRecommendations";
import {
  createBasicResourceApi,
  createFreeResourceApi,
  createMockResourceApi,
  mockRecommendations,
} from "./mockResourceApi";

describe("loadOutfitRecommendations", () => {
  it("skips GET /recommendations for Free and returns an empty list", async () => {
    const listRecommendations = vi.fn();
    const data = await loadOutfitRecommendations(
      createFreeResourceApi({ listRecommendations }),
      "wd_weekend01",
      new AbortController().signal,
    );

    expect(listRecommendations).not.toHaveBeenCalled();
    expect(data.recommendations).toEqual([]);
    expect(data.entitlement.tier).toBe("FREE");
  });

  it("loads suggested outfits for Basic", async () => {
    const listRecommendations = vi.fn().mockResolvedValue({
      recommendations: mockRecommendations,
    });
    const data = await loadOutfitRecommendations(
      createBasicResourceApi({ listRecommendations }),
      "wd_weekend01",
      new AbortController().signal,
    );

    expect(listRecommendations).toHaveBeenCalledWith(
      "wd_weekend01",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(data.recommendations).toHaveLength(mockRecommendations.length);
    expect(data.entitlement.tier).toBe("BASIC");
  });

  it("loads suggested outfits for Premium", async () => {
    const listRecommendations = vi.fn().mockResolvedValue({
      recommendations: mockRecommendations,
    });
    const data = await loadOutfitRecommendations(
      createMockResourceApi({ listRecommendations }),
      "wd_weekend01",
      new AbortController().signal,
    );

    expect(listRecommendations).toHaveBeenCalledTimes(1);
    expect(data.recommendations).toHaveLength(mockRecommendations.length);
    expect(data.entitlement.tier).toBe("PREMIUM");
  });
});
