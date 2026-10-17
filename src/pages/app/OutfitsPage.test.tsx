import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { catalogLimitError } from "../../api/catalogLimits";
import { ApiError } from "../../api/httpClient";
import {
  createEmptyResourceApi,
  createErrorResourceApi,
  createMockResourceApi,
  mockRecommendations,
} from "../../api/mockResourceApi";
import type { Outfit, OutfitRecommendationList } from "../../api/resourceTypes";
import { ENTITLEMENT_AI_REQUIRED_CODE } from "../../api/resourceTypes";
import * as resourceQueryCache from "../../hooks/resourceQueryCache";
import {
  expectActionButtonNotFullWidth,
  expectInsideNarrowContent,
} from "../../test/dashboardNarrowContentTest";
import { expectFormInsideSharedCard } from "../../test/formCardTest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { OutfitsPage } from "./OutfitsPage";

const renderPage = (
  resourceApi: ReturnType<typeof createMockResourceApi>,
) => {
  return renderWithProviders(<OutfitsPage resourceApi={resourceApi} />, {
    auth: { user: { id: "user-1" } },
  });
};

describe("OutfitsPage", () => {
  it("renders a loading state", () => {
    renderPage(
      createMockResourceApi({
        listOutfits: () => new Promise(() => undefined),
      }),
    );

    expect(
      screen.getByRole("status", { name: "Loading outfits" }),
    ).toBeInTheDocument();
  });

  it("renders a loading state for suggested outfits", async () => {
    renderPage(
      createMockResourceApi({
        listRecommendations: () => new Promise(() => undefined),
      }),
    );

    expect(
      await screen.findByRole("heading", { name: "Sunday brunch" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Loading suggested outfits" }),
    ).toBeInTheDocument();
  });

  it("renders outfits from the mock API", async () => {
    renderPage(createMockResourceApi());

    expect(
      await screen.findByRole("heading", { level: 1, name: "Outfits" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Sunday brunch" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("2 items").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "Add an outfit" }),
    ).toHaveAttribute("href", "/app/outfits/new");
    expect(
      screen.getByRole("link", { name: "Edit outfit Sunday brunch" }),
    ).toHaveAttribute(
      "href",
      "/app/outfits/outfit_brunch01/edit?wardrobeId=wd_weekend01",
    );
    expect(
      screen.getByRole("link", { name: "Virtual Try On Sunday brunch" }),
    ).toHaveAttribute(
      "href",
      "/app/virtual-try-on?wardrobeId=wd_weekend01&outfitId=outfit_brunch01",
    );
    expect(screen.getByRole("img", { name: "Sunday brunch" })).toHaveAttribute(
      "src",
      "/screenshots/try-on-ivory-maxi-390.jpg",
    );
  });

  it("renders suggested outfit cards when outfits already exist", async () => {
    renderPage(createMockResourceApi());

    expect(
      await screen.findByRole("heading", { name: "Navy + cream look" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Sunday brunch" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Save this suggestion as an outfit: Navy + cream look",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Refresh suggested outfits" }),
    ).toBeInTheDocument();
  });

  it("renders suggested outfit cards from the empty outfits state", async () => {
    renderPage(
      createMockResourceApi({
        listOutfits: async () => ({ outfits: [] }),
      }),
    );

    expectInsideNarrowContent(
      await screen.findByRole("heading", { name: "No outfits yet" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Navy + cream look" }),
    ).toBeInTheDocument();
    expectActionButtonNotFullWidth(
      screen.getByRole("link", { name: "Add an outfit" }),
    );
  });

  it("renders an empty state", async () => {
    renderPage(createEmptyResourceApi());

    expectInsideNarrowContent(
      await screen.findByRole("heading", { name: "No outfits yet" }),
    );
    expectInsideNarrowContent(
      await screen.findByRole("heading", { name: "No suggestions yet" }),
    );
    expect(
      screen.getByText("Add more items to this wardrobe, then refresh."),
    ).toBeInTheDocument();
    expectActionButtonNotFullWidth(
      screen.getByRole("link", { name: "Add an outfit" }),
    );
  });

  it("renders an empty suggestions state when the API returns no looks", async () => {
    renderPage(
      createMockResourceApi({
        listRecommendations: async () => ({ recommendations: [] }),
      }),
    );

    expect(
      await screen.findByRole("heading", { name: "No suggestions yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Sunday brunch" }),
    ).toBeInTheDocument();
  });

  it("renders an error state", async () => {
    renderPage(createErrorResourceApi());

    expect(
      await screen.findByRole("heading", { name: "Couldn't load outfits" }),
    ).toBeInTheDocument();
  });

  it("maps 403 ENTITLEMENT_AI_REQUIRED to the Premium paywall", async () => {
    renderPage(
      createMockResourceApi({
        listRecommendations: async () => {
          throw new ApiError({
            status: 403,
            code: ENTITLEMENT_AI_REQUIRED_CODE,
            message: "Premium is required for suggested outfits.",
          });
        },
      }),
    );

    expectInsideNarrowContent(
      await screen.findByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    );
    expectActionButtonNotFullWidth(
      screen.getByRole("button", {
        name: "Upgrade to Premium for Virtual Try On",
      }),
    );
  });

  it("maps any other 403 from recommendations to the Premium paywall", async () => {
    renderPage(
      createMockResourceApi({
        listRecommendations: async () => {
          throw new ApiError({
            status: 403,
            code: "FORBIDDEN",
            message: "Suggested outfits are not available.",
          });
        },
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    ).toBeInTheDocument();
  });

  it("saves a suggestion through POST outfits", async () => {
    const user = userEvent.setup();
    const createOutfit = vi.fn().mockResolvedValue({
      outfitId: "outfit_new",
      wardrobeId: "wd_weekend01",
      name: "Navy + cream look",
      items: mockRecommendations[0]?.items,
      createdAt: "2026-10-13T12:00:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
    });
    const invalidateResourceQueries = vi.spyOn(
      resourceQueryCache,
      "invalidateResourceQueries",
    );
    renderPage(createMockResourceApi({ createOutfit }));

    await user.click(
      await screen.findByRole("button", {
        name: "Save this suggestion as an outfit: Navy + cream look",
      }),
    );
    await expectFormInsideSharedCard("Save as outfit");
    await user.click(screen.getByRole("button", { name: "Save as outfit" }));

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

  it("falls back to Suggested look when the save name is blank", async () => {
    const user = userEvent.setup();
    const createOutfit = vi.fn().mockResolvedValue({
      outfitId: "outfit_new",
      wardrobeId: "wd_weekend01",
      name: "Suggested look",
      items: [{ itemId: "item_navytee01", slot: "TOP" }],
      createdAt: "2026-10-13T12:00:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
    });
    renderPage(
      createMockResourceApi({
        listRecommendations: async () => ({
          recommendations: [
            {
              items: [{ itemId: "item_navytee01", slot: "TOP" }],
            },
          ],
        }),
        createOutfit,
      }),
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Save this suggestion as an outfit: Suggested look",
      }),
    );
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Save as outfit" }));

    await waitFor(() => {
      expect(createOutfit).toHaveBeenCalledWith("wd_weekend01", {
        name: "Suggested look",
        items: [{ itemId: "item_navytee01", slot: "TOP" }],
      });
    });
  });

  it("shows the outfit-limit paywall when save returns ENTITLEMENT_OUTFIT_LIMIT", async () => {
    const user = userEvent.setup();
    const createOutfit = vi.fn().mockRejectedValue(catalogLimitError("outfit"));
    renderPage(createMockResourceApi({ createOutfit }));

    await user.click(
      await screen.findByRole("button", {
        name: "Save this suggestion as an outfit: Navy + cream look",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Save as outfit" }));

    expect(
      await screen.findByRole("heading", { name: "Outfit limit reached" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Upgrade to Basic to add more outfits",
      }),
    ).toBeInTheDocument();
  });

  it("shows a save error with Retry and retries the POST", async () => {
    const user = userEvent.setup();
    const createOutfit = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({ status: 500, message: "Outfit save failed." }),
      )
      .mockResolvedValueOnce({
        outfitId: "outfit_new",
        wardrobeId: "wd_weekend01",
        name: "Navy + cream look",
        items: mockRecommendations[0]?.items,
        createdAt: "2026-10-13T12:00:00.000Z",
        updatedAt: "2026-10-13T12:00:00.000Z",
      } as Outfit);
    renderPage(createMockResourceApi({ createOutfit }));

    await user.click(
      await screen.findByRole("button", {
        name: "Save this suggestion as an outfit: Navy + cream look",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Save as outfit" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Outfit save failed.",
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(createOutfit).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Saved as an outfit.",
    );
  });

  it("shows a load error with Retry and refetches suggestions", async () => {
    const user = userEvent.setup();
    const listRecommendations = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({ status: 500, message: "Server error" }),
      )
      .mockResolvedValueOnce({
        recommendations: mockRecommendations,
      } as OutfitRecommendationList);
    renderPage(createMockResourceApi({ listRecommendations }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't load suggested outfits. Server error",
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByRole("heading", { name: "Navy + cream look" }),
    ).toBeInTheDocument();
    expect(listRecommendations).toHaveBeenCalledTimes(2);
  });
});
