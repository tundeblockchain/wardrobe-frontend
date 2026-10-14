import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/httpClient";
import {
  createEmptyResourceApi,
  createErrorResourceApi,
  createMockResourceApi,
} from "../../api/mockResourceApi";
import type { ResourceApi } from "../../api/resourceApi";
import {
  WARDROBE_DELETE_INVALIDATION_KEYS,
} from "../../hooks/resourceQueryCache";
import * as resourceQueryCache from "../../hooks/resourceQueryCache";
import {
  appPaths,
  getAppItemPath,
  getAppWardrobePath,
  getAppWardrobeRecommendationsPath,
} from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { AppHomePage } from "./AppHomePage";
import { WardrobeDetailPage } from "./WardrobeDetailPage";

const renderPage = (wardrobeId: string, resourceApi: ResourceApi) => {
  return renderWithProviders(
    <Routes>
      <Route
        path={appPaths.app}
        element={<AppHomePage resourceApi={resourceApi} />}
      />
      <Route
        path={appPaths.appWardrobe}
        element={<WardrobeDetailPage resourceApi={resourceApi} />}
      />
    </Routes>,
    {
      route: getAppWardrobePath(wardrobeId),
      auth: { user: { id: "user-1" } },
    },
  );
};

describe("WardrobeDetailPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a loading state", () => {
    renderPage(
      "wd_weekend01",
      createMockResourceApi({
        getWardrobeDetail: () => new Promise(() => undefined),
      }),
    );

    expect(
      screen.getByRole("status", { name: "Loading wardrobe" }),
    ).toBeInTheDocument();
  });

  it("renders the wardrobe and its clothing items", async () => {
    renderPage("wd_weekend01", createMockResourceApi());

    expect(
      await screen.findByRole("heading", { level: 1, name: "Weekend closet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Navy tee" })).toHaveAttribute(
      "href",
      getAppItemPath("item_navytee01", "wd_weekend01"),
    );
    expect(screen.getByRole("img", { name: "Navy tee" })).toHaveAttribute(
      "src",
      "/screenshots/item-detail-390.jpg",
    );
    expect(screen.getByRole("link", { name: "Ivory maxi" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete this wardrobe" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Suggested outfits for this wardrobe" }),
    ).toHaveAttribute(
      "href",
      getAppWardrobeRecommendationsPath("wd_weekend01"),
    );
  });

  it("renders an empty items state for a wardrobe with no clothing", async () => {
    renderPage("wd_work02", createEmptyResourceApi());

    expect(
      await screen.findByRole("heading", { level: 1, name: "Workwear" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No clothing items yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete this wardrobe" }),
    ).toBeInTheDocument();
  });

  it("renders a not-found state for an unknown wardrobe", async () => {
    renderPage("wd_missing", createMockResourceApi());

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Wardrobe not found",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete this wardrobe" }),
    ).not.toBeInTheDocument();
  });

  it("renders an error state", async () => {
    renderPage("wd_weekend01", createErrorResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Couldn't load this wardrobe",
      }),
    ).toBeInTheDocument();
  });

  it("opens a confirm dialog with the delete copy", async () => {
    const user = userEvent.setup();
    renderPage("wd_weekend01", createMockResourceApi());

    await user.click(
      await screen.findByRole("button", { name: "Delete this wardrobe" }),
    );

    expect(
      screen.getByRole("heading", { name: "Delete wardrobe?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This permanently deletes this wardrobe and all of its items, outfits, and photos. This cannot be undone.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
      "MuiButton-colorError",
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("disables delete dialog buttons while delete is running", async () => {
    const user = userEvent.setup();
    renderPage(
      "wd_weekend01",
      createMockResourceApi({
        deleteWardrobe: () => new Promise(() => undefined),
      }),
    );

    await user.click(
      await screen.findByRole("button", { name: "Delete this wardrobe" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Weekend closet",
        hidden: true,
      }),
    ).toBeInTheDocument();
  });

  it("shows the server delete error, or a fallback when there is no message", async () => {
    const user = userEvent.setup();
    const deleteWardrobe = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({
          status: 500,
          code: "INTERNAL",
          message: "Wardrobe is still processing.",
        }),
      )
      .mockRejectedValueOnce(new Error());
    renderPage("wd_weekend01", createMockResourceApi({ deleteWardrobe }));

    await user.click(
      await screen.findByRole("button", { name: "Delete this wardrobe" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Wardrobe is still processing.",
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Weekend closet",
        hidden: true,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not delete this wardrobe.",
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Weekend closet",
        hidden: true,
      }),
    ).toBeInTheDocument();
  });

  it("invalidates catalog lists and goes to Home after a successful delete", async () => {
    const user = userEvent.setup();
    const invalidateCatalogLists = vi.spyOn(
      resourceQueryCache,
      "invalidateCatalogLists",
    );
    const deleteWardrobe = vi.fn().mockResolvedValue(undefined);
    renderPage("wd_weekend01", createMockResourceApi({ deleteWardrobe }));

    await user.click(
      await screen.findByRole("button", { name: "Delete this wardrobe" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteWardrobe).toHaveBeenCalledWith("wd_weekend01");
    });
    expect(invalidateCatalogLists).toHaveBeenCalledTimes(1);
    expect(WARDROBE_DELETE_INVALIDATION_KEYS).toEqual([
      "wardrobes",
      "outfits",
      "items",
      "me",
      "virtual-profiles",
      "virtual-try-on",
      "virtual-profile",
      "recommendations",
    ]);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Your closet" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: /saved|deleted/i }),
    ).not.toBeInTheDocument();
  });
});
