import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { catalogLimitError } from "../../api/catalogLimits";
import {
  createErrorResourceApi,
  createFreeAtLimitResourceApi,
  createMockResourceApi,
  mockFreeAtLimitEntitlement,
} from "../../api/mockResourceApi";
import type { ResourceApi } from "../../api/resourceApi";
import {
  expectFormInsideSharedCard,
  expectSharedFormCardAbsent,
} from "../../test/formCardTest";
import { appPaths, getAppWardrobeEditPath } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { WardrobeFormPage } from "./WardrobeFormPage";

const createdWardrobe = {
  wardrobeId: "wd_new",
  name: "Travel",
  createdAt: "2026-10-13T12:00:00.000Z",
  updatedAt: "2026-10-13T12:00:00.000Z",
};

const renderCreate = (resourceApi: ResourceApi) => {
  return renderWithProviders(
    <WardrobeFormPage mode="create" resourceApi={resourceApi} />,
    { auth: { user: { id: "user-1" } } },
  );
};

const renderEdit = (wardrobeId: string, resourceApi: ResourceApi) => {
  return renderWithProviders(
    <Routes>
      <Route
        path={appPaths.appWardrobeEdit}
        element={<WardrobeFormPage mode="edit" resourceApi={resourceApi} />}
      />
    </Routes>,
    {
      route: getAppWardrobeEditPath(wardrobeId),
      auth: { user: { id: "user-1" } },
    },
  );
};

describe("WardrobeFormPage", () => {
  it("renders a loading state", () => {
    renderCreate(
      createMockResourceApi({
        getMe: () => new Promise(() => undefined),
      }),
    );

    expect(
      screen.getByRole("status", { name: "Loading wardrobe" }),
    ).toBeInTheDocument();
    expectSharedFormCardAbsent();
  });

  it("renders the add wardrobe form inside the shared card", async () => {
    renderCreate(createMockResourceApi());

    await expectFormInsideSharedCard("Save wardrobe");
    expect(
      screen.getByRole("heading", { level: 1, name: "Add wardrobe" }),
    ).toBeInTheDocument();
  });

  it("renders the edit wardrobe form inside the shared card", async () => {
    renderEdit("wd_weekend01", createMockResourceApi());

    await expectFormInsideSharedCard("Save changes");
    expect(
      screen.getByRole("heading", { level: 1, name: "Edit wardrobe" }),
    ).toBeInTheDocument();
  });

  it("validates the name before creating a wardrobe", async () => {
    const user = userEvent.setup();
    const createWardrobe = vi.fn();
    renderCreate(createMockResourceApi({ createWardrobe }));

    await user.click(
      await screen.findByRole("button", { name: "Save wardrobe" }),
    );

    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(createWardrobe).not.toHaveBeenCalled();
  });

  it("creates a wardrobe from a valid name", async () => {
    const user = userEvent.setup();
    const createWardrobe = vi.fn().mockResolvedValue(createdWardrobe);
    renderCreate(createMockResourceApi({ createWardrobe }));

    await user.type(
      await screen.findByRole("textbox", { name: "Name" }),
      "Travel",
    );
    await user.click(screen.getByRole("button", { name: "Save wardrobe" }));

    await waitFor(() => {
      expect(createWardrobe).toHaveBeenCalledWith({ name: "Travel" });
    });
  });

  it("shows the upgrade prompt before a Free user hits the wardrobe limit", async () => {
    renderCreate(createFreeAtLimitResourceApi());

    expect(
      await screen.findByRole("heading", { name: "Wardrobe limit reached" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Upgrade to Basic to add more wardrobes",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save wardrobe" }),
    ).not.toBeInTheDocument();
  });

  it("reads wardrobe limit copy from the /me entitlement", async () => {
    renderCreate(
      createFreeAtLimitResourceApi(
        {},
        { limits: { wardrobes: 3, items: 12, outfits: 20 } },
      ),
    );

    expect(
      await screen.findByText(
        "You've used 3 of 3 wardrobes. Upgrade your plan to add another.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the same upgrade prompt when create returns 403", async () => {
    const user = userEvent.setup();
    const createWardrobe = vi.fn().mockRejectedValue(catalogLimitError("wardrobe"));
    renderCreate(createMockResourceApi({ createWardrobe }));

    await user.type(
      await screen.findByRole("textbox", { name: "Name" }),
      "Travel",
    );
    await user.click(screen.getByRole("button", { name: "Save wardrobe" }));

    expect(
      await screen.findByRole("heading", { name: "Wardrobe limit reached" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This plan has reached its wardrobe limit. Upgrade your plan to add another.",
      ),
    ).toBeInTheDocument();
  });

  it("shows /me limit numbers when create returns 403", async () => {
    const user = userEvent.setup();
    const createWardrobe = vi.fn().mockRejectedValue(
      catalogLimitError("wardrobe", { wardrobes: 3, items: 12, outfits: 20 }),
    );
    renderCreate(
      createMockResourceApi(
        { createWardrobe },
        {
          entitlement: {
            ...mockFreeAtLimitEntitlement,
            limits: { wardrobes: 3, items: 12, outfits: 20 },
          },
        },
      ),
    );

    await user.type(
      await screen.findByRole("textbox", { name: "Name" }),
      "Travel",
    );
    await user.click(screen.getByRole("button", { name: "Save wardrobe" }));

    expect(
      await screen.findByText(
        "You've used 2 of 3 wardrobes. Upgrade your plan to add another.",
      ),
    ).toBeInTheDocument();
  });

  it("edits an existing wardrobe", async () => {
    const user = userEvent.setup();
    const updateWardrobe = vi.fn().mockResolvedValue({
      ...createdWardrobe,
      wardrobeId: "wd_weekend01",
      name: "Weekend edit",
    });
    renderEdit("wd_weekend01", createMockResourceApi({ updateWardrobe }));

    const nameField = await screen.findByRole("textbox", { name: "Name" });
    expect(nameField).toHaveValue("Weekend closet");
    await user.clear(nameField);
    await user.type(nameField, "Weekend edit");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updateWardrobe).toHaveBeenCalledWith("wd_weekend01", {
        name: "Weekend edit",
      });
    });
  });

  it("renders an error state when the wardrobe cannot be loaded", async () => {
    renderEdit("wd_weekend01", createErrorResourceApi());

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Couldn't save this wardrobe",
      }),
    ).toBeInTheDocument();
  });
});
