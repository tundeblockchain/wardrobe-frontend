import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import {
  createErrorResourceApi,
  createMockResourceApi,
} from "../../api/mockResourceApi";
import type { ResourceApi } from "../../api/resourceApi";
import { appPaths, getAppItemPath } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ItemDetailPage } from "./ItemDetailPage";

const renderPage = (route: string, resourceApi: ResourceApi) => {
  return renderWithProviders(
    <Routes>
      <Route
        path={appPaths.appItem}
        element={<ItemDetailPage resourceApi={resourceApi} />}
      />
    </Routes>,
    {
      route,
      auth: { user: { id: "user-1" } },
    },
  );
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
    expect(screen.getByText("Example Brand")).toBeInTheDocument();
    expect(screen.getByText("Navy")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Navy tee" })).toHaveAttribute(
      "src",
      "/screenshots/item-detail-390.jpg",
    );
    expect(screen.getByRole("link", { name: "Back to wardrobe" })).toHaveAttribute(
      "href",
      "/app/wardrobes/wd_weekend01",
    );
  });

  it("renders a not-found state for an unknown item", async () => {
    renderPage(getAppItemPath("item_missing"), createMockResourceApi());

    expect(
      await screen.findByRole("heading", { level: 1, name: "Item not found" }),
    ).toBeInTheDocument();
  });

  it("renders an error state", async () => {
    renderPage(getAppItemPath("item_navytee01"), createErrorResourceApi());

    expect(
      await screen.findByRole("heading", { name: "Couldn't load this item" }),
    ).toBeInTheDocument();
  });
});
