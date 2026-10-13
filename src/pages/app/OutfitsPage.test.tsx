import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createEmptyResourceApi,
  createErrorResourceApi,
  createMockResourceApi,
} from "../../api/mockResourceApi";
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

  it("renders outfits from the mock API", async () => {
    renderPage(createMockResourceApi());

    expect(
      await screen.findByRole("heading", { level: 1, name: "Outfits" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Sunday brunch" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 items")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Add an outfit" }),
    ).toHaveAttribute("href", "/app/outfits/new");
    expect(
      screen.getByRole("link", { name: "Edit outfit Sunday brunch" }),
    ).toHaveAttribute(
      "href",
      "/app/outfits/outfit_brunch01/edit?wardrobeId=wd_weekend01",
    );
    expect(screen.getByRole("img", { name: "Sunday brunch" })).toHaveAttribute(
      "src",
      "/screenshots/try-on-ivory-maxi-390.jpg",
    );
  });

  it("renders an empty state", async () => {
    renderPage(createEmptyResourceApi());

    expect(
      await screen.findByRole("heading", { name: "No outfits yet" }),
    ).toBeInTheDocument();
  });

  it("renders an error state", async () => {
    renderPage(createErrorResourceApi());

    expect(
      await screen.findByRole("heading", { name: "Couldn't load outfits" }),
    ).toBeInTheDocument();
  });
});
