import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { catalogLimitError } from "../../api/catalogLimits";
import {
  createErrorResourceApi,
  createFreeAtLimitResourceApi,
  createMockResourceApi,
} from "../../api/mockResourceApi";
import type { ResourceApi } from "../../api/resourceApi";
import { appPaths } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { OutfitFormPage } from "./OutfitFormPage";

const renderCreate = (resourceApi: ResourceApi) => {
  return renderWithProviders(
    <OutfitFormPage mode="create" resourceApi={resourceApi} />,
    { auth: { user: { id: "user-1" } } },
  );
};

describe("OutfitFormPage", () => {
  it("renders a loading state", () => {
    renderCreate(
      createMockResourceApi({
        getMe: () => new Promise(() => undefined),
      }),
    );

    expect(
      screen.getByRole("status", { name: "Loading outfit" }),
    ).toBeInTheDocument();
  });

  it("validates name, wardrobe, and items", async () => {
    const user = userEvent.setup();
    const createOutfit = vi.fn();
    renderCreate(createMockResourceApi({ createOutfit }));

    await user.click(await screen.findByRole("button", { name: "Save outfit" }));

    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Wardrobe is required.")).toBeInTheDocument();
    expect(
      screen.getByText("Choose at least one clothing item."),
    ).toBeInTheDocument();
    expect(createOutfit).not.toHaveBeenCalled();
  });

  it("creates an outfit from selected wardrobe items", async () => {
    const user = userEvent.setup();
    const createOutfit = vi.fn().mockResolvedValue({
      outfitId: "outfit_new",
      wardrobeId: "wd_weekend01",
      name: "Cafe",
      items: [{ itemId: "item_navytee01", slot: "TOP" }],
      createdAt: "2026-10-13T12:00:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
    });
    renderCreate(createMockResourceApi({ createOutfit }));

    await user.type(
      await screen.findByRole("textbox", { name: "Name" }),
      "Cafe",
    );
    await user.click(screen.getByRole("combobox", { name: "Wardrobe" }));
    await user.click(await screen.findByRole("option", { name: "Weekend closet" }));
    await user.click(
      await screen.findByRole("checkbox", { name: /Navy tee/ }),
    );
    await user.click(screen.getByRole("button", { name: "Save outfit" }));

    await waitFor(() => {
      expect(createOutfit).toHaveBeenCalledWith("wd_weekend01", {
        name: "Cafe",
        items: [{ itemId: "item_navytee01", slot: "TOP" }],
      });
    });
  });

  it("shows the upgrade prompt before a Free user hits the outfit limit", async () => {
    renderCreate(createFreeAtLimitResourceApi());

    expect(
      await screen.findByRole("heading", { name: "Outfit limit reached" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View plan to add more outfits" }),
    ).toHaveAttribute("href", appPaths.appPlan);
  });

  it("shows the same upgrade prompt when create returns 403", async () => {
    const user = userEvent.setup();
    const createOutfit = vi.fn().mockRejectedValue(catalogLimitError("outfit"));
    renderCreate(createMockResourceApi({ createOutfit }));

    await user.type(
      await screen.findByRole("textbox", { name: "Name" }),
      "Cafe",
    );
    await user.click(screen.getByRole("combobox", { name: "Wardrobe" }));
    await user.click(await screen.findByRole("option", { name: "Weekend closet" }));
    await user.click(
      await screen.findByRole("checkbox", { name: /Navy tee/ }),
    );
    await user.click(screen.getByRole("button", { name: "Save outfit" }));

    expect(
      await screen.findByRole("heading", { name: "Outfit limit reached" }),
    ).toBeInTheDocument();
  });

  it("renders an error state", async () => {
    renderCreate(createErrorResourceApi());

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Couldn't save this outfit",
      }),
    ).toBeInTheDocument();
  });
});
