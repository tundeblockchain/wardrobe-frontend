import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/httpClient";
import {
  createBasicResourceApi,
  createEmptyResourceApi,
  createEntitlementAiRequiredResourceApi,
  createErrorResourceApi,
  createFreeResourceApi,
  createMockResourceApi,
  mockRecommendations,
} from "../../api/mockResourceApi";
import type { ResourceApi } from "../../api/resourceApi";
import {
  ENTITLEMENT_AI_REQUIRED_CODE,
  type OutfitRecommendation,
  type OutfitRecommendationList,
} from "../../api/resourceTypes";
import {
  appPaths,
  getAppWardrobePath,
  getAppWardrobeRecommendationsPath,
} from "../../routes/paths";
import {
  expectActionButtonNotFullWidth,
  expectInsideNarrowContent,
} from "../../test/dashboardNarrowContentTest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { RecommendationDetailPage } from "./RecommendationDetailPage";
import { RecommendationsPage } from "./RecommendationsPage";

const envelopeRecommendations: OutfitRecommendation[] = [
  {
    name: "Navy + cream look",
    reason: "A weekend look from pieces you already own.",
    items: [
      { itemId: "item_navytee01", slot: "TOP" },
      { itemId: "item_ivorymaxi01", slot: "DRESS" },
    ],
  },
];

const titleOnlyRecommendation: OutfitRecommendation = {
  title: "Ivory maxi evening",
  items: [{ itemId: "item_ivorymaxi01", slot: "DRESS" }],
};

const renderList = (
  wardrobeId: string,
  resourceApi: ResourceApi,
  route = getAppWardrobeRecommendationsPath(wardrobeId),
) => {
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
      <Route path={appPaths.appWardrobe} element={<p>Wardrobe detail</p>} />
    </Routes>,
    {
      route,
      auth: { user: { id: "user-1" } },
    },
  );
};

describe("RecommendationsPage", () => {
  it("renders a loading state", () => {
    renderList(
      "wd_weekend01",
      createMockResourceApi({
        listRecommendations: () => new Promise(() => undefined),
      }),
    );

    expect(
      screen.getByRole("status", { name: "Loading suggested outfits" }),
    ).toBeInTheDocument();
  });

  it("renders suggestions from the object envelope and item photos", async () => {
    renderList(
      "wd_weekend01",
      createMockResourceApi({
        listRecommendations: async () => ({
          recommendations: envelopeRecommendations,
        }),
      }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Suggested outfits" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Navy + cream look" }),
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
    expect(
      screen.getByRole("button", { name: "Refresh suggested outfits" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to wardrobe" }),
    ).toHaveAttribute("href", getAppWardrobePath("wd_weekend01"));
  });

  it("renders suggestions from a bare array, including title fields", async () => {
    renderList(
      "wd_weekend01",
      createMockResourceApi({
        listRecommendations: async () =>
          [titleOnlyRecommendation] as unknown as OutfitRecommendationList,
      }),
    );

    expect(
      await screen.findByRole("heading", { name: "Ivory maxi evening" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ivory maxi")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Ivory maxi" }),
    ).toHaveAttribute("src", "/screenshots/try-on-ivory-maxi-390.jpg");
  });

  it("renders an empty state", async () => {
    renderList("wd_work02", createEmptyResourceApi());

    expectInsideNarrowContent(
      await screen.findByRole("heading", { name: "No suggestions yet" }),
    );
    expect(
      screen.getByText("Add more items to this wardrobe, then refresh."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Refresh suggested outfits" }),
    ).toBeInTheDocument();
  });

  it("renders an error state", async () => {
    renderList("wd_weekend01", createErrorResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Couldn't load suggested outfits",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Suggested outfits need a paid plan",
      }),
    ).not.toBeInTheDocument();
  });

  it("maps 403 ENTITLEMENT_AI_REQUIRED to the Basic upgrade prompt", async () => {
    renderList("wd_weekend01", createEntitlementAiRequiredResourceApi());

    expectInsideNarrowContent(
      await screen.findByRole("heading", {
        name: "Suggested outfits need a paid plan",
      }),
    );
    expect(
      screen.getByText(
        "Upgrade to Basic or Premium for unlimited suggested outfits from clothing items you already own.",
      ),
    ).toBeInTheDocument();
    expectActionButtonNotFullWidth(
      screen.getByRole("button", {
        name: "Upgrade to Basic for suggested outfits",
      }),
    );
    expect(
      screen.getByRole("link", {
        name: "Compare Free, Basic, and Premium plans",
      }),
    ).toHaveAttribute("href", "/app/pricing");
    expect(
      screen.queryByRole("heading", {
        name: "Couldn't load suggested outfits",
      }),
    ).not.toBeInTheDocument();
  });

  it("keeps suggested outfits locked for Free", async () => {
    renderList("wd_weekend01", createFreeResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Suggested outfits need a paid plan",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Navy + cream look" }),
    ).not.toBeInTheDocument();
  });

  it("shows suggested outfits for Basic", async () => {
    renderList("wd_weekend01", createBasicResourceApi());

    expect(
      await screen.findByRole("heading", { name: "Navy + cream look" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Suggested outfits need a paid plan",
      }),
    ).not.toBeInTheDocument();
  });

  it("shows suggested outfits for Premium", async () => {
    renderList("wd_weekend01", createMockResourceApi());

    expect(
      await screen.findByRole("heading", { name: "Navy + cream look" }),
    ).toBeInTheDocument();
  });

  it("maps a 403 from GET /recommendations to the existing upgrade prompt", async () => {
    renderList(
      "wd_weekend01",
      createMockResourceApi({
        listRecommendations: async () => {
          throw new ApiError({
            status: 403,
            code: ENTITLEMENT_AI_REQUIRED_CODE,
            message: "A paid plan is required for suggested outfits.",
          });
        },
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Suggested outfits need a paid plan",
      }),
    ).toBeInTheDocument();
  });

  it("opens the detail view from router state and does not look the suggestion up by index", async () => {
    const user = userEvent.setup();
    const listRecommendations = vi.fn().mockResolvedValue({
      recommendations: mockRecommendations,
    });
    renderList(
      "wd_weekend01",
      createMockResourceApi({ listRecommendations }),
    );

    await user.click(
      await screen.findByRole("link", { name: "Navy + cream look" }),
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Navy + cream look",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save this suggestion as an outfit" }),
    ).toBeInTheDocument();
    expect(listRecommendations).toHaveBeenCalledTimes(1);
    expect(listRecommendations).not.toHaveBeenCalledWith(
      "wd_weekend01",
      expect.objectContaining({ index: expect.anything() }),
    );
  });

  it("refetches only when Refresh is pressed", async () => {
    const user = userEvent.setup();
    const listRecommendations = vi
      .fn()
      .mockResolvedValueOnce({ recommendations: envelopeRecommendations })
      .mockResolvedValueOnce({
        recommendations: [titleOnlyRecommendation],
      });
    renderList(
      "wd_weekend01",
      createMockResourceApi({ listRecommendations }),
    );

    expect(
      await screen.findByRole("heading", { name: "Navy + cream look" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Refresh suggested outfits" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Ivory maxi evening" }),
    ).toBeInTheDocument();
    expect(listRecommendations).toHaveBeenCalledTimes(2);
  });

  it("aborts the recommendations request on unmount", async () => {
    const listRecommendations = vi.fn(
      (_wardrobeId: string, options?: { signal?: AbortSignal }) => {
        return new Promise<OutfitRecommendationList>((_resolve, reject) => {
          options?.signal?.addEventListener(
            "abort",
            () => {
              reject(new DOMException("Aborted", "AbortError"));
            },
            { once: true },
          );
        });
      },
    );
    const { unmount } = renderList(
      "wd_weekend01",
      createMockResourceApi({ listRecommendations }),
    );

    await waitFor(() => {
      expect(listRecommendations).toHaveBeenCalledTimes(1);
    });
    const signal = listRecommendations.mock.calls[0]?.[1]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);

    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
