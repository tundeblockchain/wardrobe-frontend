import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import {
  createEmptyResourceApi,
  createErrorResourceApi,
  createMockResourceApi,
} from "../../api/mockResourceApi";
import type { ResourceApi } from "../../api/resourceApi";
import { appPaths, getAppItemPath, getAppWardrobePath } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { WardrobeDetailPage } from "./WardrobeDetailPage";

const renderPage = (wardrobeId: string, resourceApi: ResourceApi) => {
  return renderWithProviders(
    <Routes>
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
  });

  it("renders an empty items state for a wardrobe with no clothing", async () => {
    renderPage("wd_work02", createEmptyResourceApi());

    expect(
      await screen.findByRole("heading", { level: 1, name: "Workwear" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No clothing items yet" }),
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
  });

  it("renders an error state", async () => {
    renderPage("wd_weekend01", createErrorResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Couldn't load this wardrobe",
      }),
    ).toBeInTheDocument();
  });
});
