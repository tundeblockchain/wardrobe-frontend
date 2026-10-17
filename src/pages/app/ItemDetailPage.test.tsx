import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/httpClient";
import {
  createAiTryOnOffResourceApi,
  createErrorResourceApi,
  createMockResourceApi,
  mockItems,
} from "../../api/mockResourceApi";
import { ENTITLEMENT_AI_REQUIRED_CODE } from "../../api/resourceTypes";
import type { ClothingItem } from "../../api/resourceTypes";
import type { ResourceApi } from "../../api/resourceApi";
import {
  appPaths,
  getAppItemEditPath,
  getAppItemPath,
  getAppVirtualTryOnPath,
} from "../../routes/paths";
import {
  expectActionButtonNotFullWidth,
  expectInsideNarrowContent,
} from "../../test/dashboardNarrowContentTest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ItemDetailPage } from "./ItemDetailPage";

const renderPage = (route: string, resourceApi: ResourceApi) => {
  return renderWithProviders(
    <Routes>
      <Route
        path={appPaths.appItem}
        element={<ItemDetailPage resourceApi={resourceApi} />}
      />
      <Route
        path={appPaths.appWardrobe}
        element={<h1>Weekend closet</h1>}
      />
      <Route
        path={appPaths.appVirtualTryOn}
        element={<h1>Virtual Try On page</h1>}
      />
    </Routes>,
    {
      route,
      auth: { user: { id: "user-1" } },
    },
  );
};

const sparseItem: ClothingItem = {
  itemId: "item_sparse01",
  wardrobeId: "wd_weekend01",
  name: "   ",
  category: "TOP",
  processingStatus: "READY",
  createdAt: "2026-09-03T18:40:00.000Z",
  updatedAt: "2026-09-03T18:40:00.000Z",
};

describe("ItemDetailPage", () => {
  it("renders a loading state", () => {
    renderPage(
      getAppItemPath("item_navytee01"),
      createMockResourceApi({
        getItem: () => new Promise(() => undefined),
      }),
    );

    expect(
      screen.getByRole("status", { name: "Loading clothing item" }),
    ).toBeInTheDocument();
  });

  it("renders clothing item details and the API image URL", async () => {
    renderPage(
      getAppItemPath("item_navytee01", "wd_weekend01"),
      createMockResourceApi(),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Navy tee" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Brand" })).toHaveTextContent(
      "Example Brand",
    );
    expect(screen.getByText("Navy")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Navy tee" })).toHaveAttribute(
      "src",
      "/screenshots/item-detail-390.jpg",
    );
    expect(screen.getByRole("link", { name: "Back to wardrobe" })).toHaveAttribute(
      "href",
      "/app/wardrobes/wd_weekend01",
    );
    expect(screen.getByRole("link", { name: "Weekend closet" })).toHaveAttribute(
      "href",
      "/app/wardrobes/wd_weekend01",
    );
    expect(screen.getByRole("link", { name: "Sunday brunch" })).toHaveAttribute(
      "href",
      "/app/outfits/outfit_brunch01/edit?wardrobeId=wd_weekend01",
    );
    expect(
      screen.getByRole("link", { name: "Edit this clothing item" }),
    ).toHaveAttribute("href", getAppItemEditPath("item_navytee01", "wd_weekend01"));
    expect(
      screen.getByRole("link", { name: "Virtual Try On this clothing item" }),
    ).toHaveAttribute(
      "href",
      getAppVirtualTryOnPath({
        itemId: "item_navytee01",
        wardrobeId: "wd_weekend01",
      }),
    );
    expect(
      screen.queryByRole("heading", { name: "Virtual Try On gallery" }),
    ).not.toBeInTheDocument();
  });

  it("shows Not set for empty detail rows and Item when the name is missing", async () => {
    renderPage(
      getAppItemPath("item_sparse01"),
      createMockResourceApi({
        getItem: async () => sparseItem,
        listOutfits: async () => ({ outfits: [] }),
      }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Item" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Category" })).toHaveTextContent("Top");
    expect(screen.getByRole("group", { name: "Subcategory" })).toHaveTextContent(
      "Not set",
    );
    expect(screen.getByRole("group", { name: "Colours" })).toHaveTextContent(
      "Not set",
    );
    expect(screen.getByRole("group", { name: "Brand" })).toHaveTextContent(
      "Not set",
    );
    expect(screen.getByRole("group", { name: "Acquired" })).toHaveTextContent(
      "Not set",
    );
    expect(screen.queryByRole("group", { name: "Season" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Notes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Size" })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Tags" })).not.toBeInTheDocument();
  });

  it("shows web-only extras and the Virtual Try On gallery when they are present", async () => {
    renderPage(
      getAppItemPath("item_navytee01"),
      createMockResourceApi({
        getItem: async () => ({
          ...mockItems[0]!,
          season: "Autumn",
          notes: "Everyday layer",
          size: "M",
          tags: ["casual"],
          renderImageUrls: ["/screenshots/try-on-started.jpg"],
        }),
      }),
    );

    expect(await screen.findByRole("group", { name: "Season" })).toHaveTextContent(
      "Autumn",
    );
    expect(screen.getByRole("group", { name: "Notes" })).toHaveTextContent(
      "Everyday layer",
    );
    expect(screen.getByRole("group", { name: "Size" })).toHaveTextContent("M");
    expect(screen.getByText("casual")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Virtual Try On gallery" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-started.jpg");
  });

  it("deletes a clothing item after confirm and returns to the wardrobe page", async () => {
    const user = userEvent.setup();
    const deleteItem = vi.fn().mockResolvedValue(undefined);
    renderPage(
      getAppItemPath("item_navytee01"),
      createMockResourceApi({ deleteItem }),
    );

    await user.click(
      await screen.findByRole("button", { name: "Delete this clothing item" }),
    );
    expect(screen.getByRole("heading", { name: "Delete item?" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "This permanently deletes this clothing item and its photos. This cannot be undone.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteItem).toHaveBeenCalledWith("wd_weekend01", "item_navytee01");
    expect(
      await screen.findByRole("heading", { name: "Weekend closet" }),
    ).toBeInTheDocument();
  });

  it("disables delete dialog buttons while delete is running", async () => {
    const user = userEvent.setup();
    renderPage(
      getAppItemPath("item_navytee01"),
      createMockResourceApi({
        deleteItem: () => new Promise(() => undefined),
      }),
    );

    await user.click(
      await screen.findByRole("button", { name: "Delete this clothing item" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  it("shows the server delete error, or a fallback when there is no message", async () => {
    const user = userEvent.setup();
    const deleteItem = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({
          status: 500,
          code: "INTERNAL",
          message: "Item is still processing.",
        }),
      )
      .mockRejectedValueOnce(new Error());
    renderPage(
      getAppItemPath("item_navytee01"),
      createMockResourceApi({ deleteItem }),
    );

    await user.click(
      await screen.findByRole("button", { name: "Delete this clothing item" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Item is still processing.",
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not delete this item.",
    );
  });

  it("maps 403 ENTITLEMENT_AI_REQUIRED on /me to a Premium Virtual Try On prompt", async () => {
    const user = userEvent.setup();
    renderPage(
      getAppItemPath("item_navytee01"),
      createMockResourceApi({
        getMe: async () => {
          throw new ApiError({
            status: 403,
            code: ENTITLEMENT_AI_REQUIRED_CODE,
            message: "Premium is required for Virtual Try On.",
          });
        },
      }),
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Virtual Try On this clothing item",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    ).toBeInTheDocument();
  });

  it("gates Virtual Try On behind Premium when aiTryOn is off", async () => {
    const user = userEvent.setup();
    renderPage(
      getAppItemPath("item_navytee01"),
      createAiTryOnOffResourceApi(),
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Virtual Try On this clothing item",
      }),
    );

    expectInsideNarrowContent(
      screen.getByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    );
    expectActionButtonNotFullWidth(
      screen.getByRole("button", {
        name: "Upgrade to Premium for Virtual Try On",
      }),
    );
    expect(
      screen.queryByRole("link", { name: "Virtual Try On this clothing item" }),
    ).not.toBeInTheDocument();
  });

  it("renders a not-found state for an unknown or other-user item", async () => {
    renderPage(
      getAppItemPath("item_other"),
      createMockResourceApi({
        getItem: async () => {
          throw new ApiError({
            status: 404,
            code: "ITEM_NOT_FOUND",
            message: "Clothing item not found.",
          });
        },
      }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Item not found" }),
    ).toBeInTheDocument();
    expectInsideNarrowContent(
      screen.getByRole("heading", { level: 2, name: "Item not found" }),
    );
    expect(
      screen.queryByRole("heading", { name: "Couldn't load this item" }),
    ).not.toBeInTheDocument();
  });

  it("renders an error state", async () => {
    renderPage(getAppItemPath("item_navytee01"), createErrorResourceApi());

    expect(
      await screen.findByRole("heading", { name: "Couldn't load this item" }),
    ).toBeInTheDocument();
  });
});
