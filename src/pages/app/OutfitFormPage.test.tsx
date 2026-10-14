import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { catalogLimitError } from "../../api/catalogLimits";
import {
  createErrorResourceApi,
  createFreeAtLimitResourceApi,
  createMockResourceApi,
} from "../../api/mockResourceApi";
import type { ResourceApi } from "../../api/resourceApi";
import {
  expectFormInsideSharedCard,
  expectSharedFormCardAbsent,
} from "../../test/formCardTest";
import { appPaths, getAppOutfitEditPath } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import {
  createUnstableFreeAtLimitGetMeApi,
  createUnstableGetMeApi,
  expectBoundedGetMeFetches,
} from "../../test/unstableGetMeApi";
import { SettingsPage } from "./SettingsPage";
import { OutfitFormPage } from "./OutfitFormPage";

const renderCreate = (resourceApi: ResourceApi) => {
  return renderWithProviders(
    <OutfitFormPage mode="create" resourceApi={resourceApi} />,
    { auth: { user: { id: "user-1" } } },
  );
};

const renderEdit = (outfitId: string, resourceApi: ResourceApi) => {
  return renderWithProviders(
    <Routes>
      <Route
        path={appPaths.appOutfitEdit}
        element={<OutfitFormPage mode="edit" resourceApi={resourceApi} />}
      />
    </Routes>,
    {
      route: getAppOutfitEditPath(outfitId, "wd_weekend01"),
      auth: { user: { id: "user-1" } },
    },
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
    expectSharedFormCardAbsent();
  });

  it("renders the add outfit form inside the shared card", async () => {
    renderCreate(createMockResourceApi());

    await expectFormInsideSharedCard("Save outfit");
    expect(
      screen.getByRole("heading", { name: "Add outfit" }),
    ).toBeInTheDocument();
  });

  it("renders the edit outfit form inside the shared card", async () => {
    renderEdit("outfit_brunch01", createMockResourceApi());

    await expectFormInsideSharedCard("Save changes");
    expect(
      screen.getByRole("heading", { name: "Edit outfit" }),
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

  it("reads outfit limit copy from the /me entitlement", async () => {
    renderCreate(
      createFreeAtLimitResourceApi(
        {},
        { limits: { wardrobes: 3, items: 12, outfits: 20 } },
      ),
    );

    expect(
      await screen.findByText(
        "You've used 20 of 20 outfits. Upgrade your plan to add another.",
      ),
    ).toBeInTheDocument();
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
    expect(
      screen.getByText(
        "This plan has reached its outfit limit. Upgrade your plan to add another.",
      ),
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

  it("renders Add outfit without refetching GET /me in a loop", async () => {
    const getMe = vi.fn().mockImplementation(createMockResourceApi().getMe);
    renderCreate(createUnstableGetMeApi(getMe));

    expect(
      await screen.findByRole("textbox", { name: "Name" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Add outfit" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Wardrobe" }),
    ).toBeInTheDocument();
    await expectBoundedGetMeFetches(getMe);
  });

  it("opens View plan from Add outfit without refetching GET /me in a loop", async () => {
    const user = userEvent.setup();
    const getMe = vi
      .fn()
      .mockImplementation(createFreeAtLimitResourceApi().getMe);
    const resourceApi = createUnstableFreeAtLimitGetMeApi(getMe);

    renderWithProviders(
      <Routes>
        <Route
          path={appPaths.appOutfitNew}
          element={<OutfitFormPage mode="create" resourceApi={resourceApi} />}
        />
        <Route
          path={appPaths.appSettings}
          element={<SettingsPage resourceApi={resourceApi} />}
        />
      </Routes>,
      {
        route: appPaths.appOutfitNew,
        auth: { user: { id: "user-1" } },
      },
    );

    expect(
      await screen.findByRole("heading", { name: "Outfit limit reached" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("link", { name: "View plan to add more outfits" }),
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Profile & Settings",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upgrade to Basic" }),
    ).toBeInTheDocument();
    await expectBoundedGetMeFetches(getMe);
  });
});
