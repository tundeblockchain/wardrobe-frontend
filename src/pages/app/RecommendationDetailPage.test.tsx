import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import {
  createMockResourceApi,
  mockItems,
} from "../../api/mockResourceApi";
import {
  SUGGESTED_OUTFIT_STATE_KEY,
  toSuggestedOutfitView,
} from "../../api/outfitRecommendations";
import type { ResourceApi } from "../../api/resourceApi";
import type { Outfit, OutfitRecommendation } from "../../api/resourceTypes";
import * as resourceQueryCache from "../../hooks/resourceQueryCache";
import {
  appPaths,
  getAppWardrobeRecommendationDetailPath,
  getAppWardrobeRecommendationsPath,
} from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { RecommendationDetailPage } from "./RecommendationDetailPage";
import { RecommendationsPage } from "./RecommendationsPage";

const recommendation: OutfitRecommendation = {
  name: "Navy + cream look",
  reason: "A weekend look from pieces you already own.",
  items: [
    { itemId: "item_navytee01", slot: "TOP" },
    { itemId: "item_ivorymaxi01", slot: "DRESS" },
  ],
};

const suggestedOutfit = toSuggestedOutfitView(recommendation, mockItems);

const renderDetail = (
  resourceApi: ResourceApi,
  options: { includeState?: boolean; wardrobeId?: string } = {},
) => {
  const wardrobeId = options.wardrobeId ?? "wd_weekend01";
  const includeState = options.includeState ?? true;

  return renderWithProviders(
    <Routes>
      <Route
        path={appPaths.appWardrobeRecommendations}
        element={<RecommendationsPage resourceApi={resourceApi} />}
      />
      <Route
        path={appPaths.appWardrobeRecommendationDetail}
        element={<RecommendationDetailPage resourceApi={resourceApi} />}
      />
    </Routes>,
    {
      route: getAppWardrobeRecommendationDetailPath(wardrobeId),
      routeState: includeState
        ? { [SUGGESTED_OUTFIT_STATE_KEY]: suggestedOutfit }
        : undefined,
      auth: { user: { id: "user-1" } },
    },
  );
};

describe("RecommendationDetailPage", () => {
  it("renders the selected suggestion from router state without refetching it", async () => {
    const listRecommendations = vi.fn();
    const getOutfit = vi.fn();
    renderDetail(
      createMockResourceApi({ listRecommendations, getOutfit }),
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Navy + cream look",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A weekend look from pieces you already own."),
    ).toBeInTheDocument();
    expect(screen.getByText("Navy tee")).toBeInTheDocument();
    expect(screen.getByText("Ivory maxi")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Navy tee" })).toHaveAttribute(
      "src",
      "/screenshots/item-detail-390.jpg",
    );
    expect(listRecommendations).not.toHaveBeenCalled();
    expect(getOutfit).not.toHaveBeenCalled();
  });

  it("redirects to the list when router state is missing", async () => {
    const listRecommendations = vi.fn().mockResolvedValue({
      recommendations: [recommendation],
    });
    renderDetail(createMockResourceApi({ listRecommendations }), {
      includeState: false,
    });

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Suggested outfits",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Save this suggestion as an outfit",
      }),
    ).not.toBeInTheDocument();
    expect(listRecommendations).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", { name: "Navy + cream look" }),
    ).toBeInTheDocument();
  });

  it("saves the suggestion through POST outfits with the suggestion items and name", async () => {
    const user = userEvent.setup();
    const createOutfit = vi.fn().mockResolvedValue({
      outfitId: "outfit_new",
      wardrobeId: "wd_weekend01",
      name: "Navy + cream look",
      items: recommendation.items,
      createdAt: "2026-10-13T12:00:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
    });
    const invalidateResourceQueries = vi.spyOn(
      resourceQueryCache,
      "invalidateResourceQueries",
    );
    renderDetail(createMockResourceApi({ createOutfit }));

    await user.click(
      await screen.findByRole("button", {
        name: "Save this suggestion as an outfit",
      }),
    );

    await waitFor(() => {
      expect(createOutfit).toHaveBeenCalledWith("wd_weekend01", {
        name: "Navy + cream look",
        items: [
          { itemId: "item_navytee01", slot: "TOP" },
          { itemId: "item_ivorymaxi01", slot: "DRESS" },
        ],
      });
    });
    expect(invalidateResourceQueries).toHaveBeenCalledWith(["outfits"]);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Saved as an outfit.",
    );
  });

  it("guards Save as outfit against double submits", async () => {
    let resolveSave: ((value: Outfit) => void) | undefined;
    const createOutfit = vi.fn(
      () =>
        new Promise<Outfit>((resolve) => {
          resolveSave = resolve;
        }),
    );
    renderDetail(createMockResourceApi({ createOutfit }));

    const saveButton = await screen.findByRole("button", {
      name: "Save this suggestion as an outfit",
    });
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    expect(createOutfit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Saving outfit" })).toBeDisabled();

    resolveSave?.({
      outfitId: "outfit_new",
      wardrobeId: "wd_weekend01",
      name: "Navy + cream look",
      items: recommendation.items,
      createdAt: "2026-10-13T12:00:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Saved as an outfit.",
    );
  });

  it("does not treat the list path as a suggestion lookup", () => {
    expect(getAppWardrobeRecommendationsPath("wd_weekend01")).toBe(
      "/app/wardrobes/wd_weekend01/recommendations",
    );
    expect(getAppWardrobeRecommendationDetailPath("wd_weekend01")).toBe(
      "/app/wardrobes/wd_weekend01/recommendations/detail",
    );
    expect(getAppWardrobeRecommendationDetailPath("wd_weekend01")).not.toMatch(
      /\/0$|\/1$/,
    );
  });
});
