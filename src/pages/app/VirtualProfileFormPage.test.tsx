import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import {
  createAiTryOnOffResourceApi,
  createErrorResourceApi,
  createMockResourceApi,
  createOtherAiOffResourceApi,
} from "../../api/mockResourceApi";
import type { ResourceApi } from "../../api/resourceApi";
import {
  expectFormInsideSharedCard,
  expectSharedFormCardAbsent,
} from "../../test/formCardTest";
import { appPaths } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { VirtualProfileFormPage } from "./VirtualProfileFormPage";

const renderCreate = (resourceApi: ResourceApi) => {
  return renderWithProviders(
    <VirtualProfileFormPage resourceApi={resourceApi} mode="create" />,
    { auth: { user: { id: "user-1" } } },
  );
};

const renderEdit = (aiProfileId: string, resourceApi: ResourceApi) => {
  return renderWithProviders(
    <Routes>
      <Route
        path={appPaths.appVirtualProfileEdit}
        element={
          <VirtualProfileFormPage resourceApi={resourceApi} mode="edit" />
        }
      />
    </Routes>,
    {
      route: `/app/virtual-profiles/${aiProfileId}/edit`,
      auth: { user: { id: "user-1" } },
    },
  );
};

describe("VirtualProfileFormPage", () => {
  it("renders a loading state", () => {
    renderCreate(
      createMockResourceApi({
        getMe: () => new Promise(() => undefined),
      }),
    );

    expect(
      screen.getByRole("status", { name: "Loading Virtual Profile" }),
    ).toBeInTheDocument();
    expectSharedFormCardAbsent();
  });

  it("renders the add Virtual Profile form inside the shared card", async () => {
    renderCreate(createMockResourceApi());

    await expectFormInsideSharedCard("Save Virtual Profile");
    expect(
      screen.getByRole("heading", { name: "Add Virtual Profile" }),
    ).toBeInTheDocument();
  });

  it("renders the edit Virtual Profile form inside the shared card", async () => {
    renderEdit("aip_personal01", createMockResourceApi());

    await expectFormInsideSharedCard("Save changes");
    expect(
      screen.getByRole("heading", { name: "Edit Virtual Profile" }),
    ).toBeInTheDocument();
  });

  it("creates a Virtual Profile after POST /uploads", async () => {
    const user = userEvent.setup();
    const createAiProfile = vi.fn().mockResolvedValue({
      aiProfileId: "aip_new",
      type: "PERSONAL",
      referenceImages: ["users/user-1/uploads/upl_mock.jpg"],
      status: "READY",
      createdAt: "2026-10-13T12:00:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
      label: "Evening look",
    });
    const putFile = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <VirtualProfileFormPage
        resourceApi={createMockResourceApi({ createAiProfile })}
        mode="create"
        putFile={putFile}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    await user.type(await screen.findByLabelText("Name"), "Evening look");
    const fileInput = screen.getByLabelText("Photo");
    await user.upload(
      fileInput,
      new File(["photo"], "profile.jpg", { type: "image/jpeg" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Save Virtual Profile" }),
    );

    expect(putFile).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: "image/jpeg",
      }),
    );
    expect(createAiProfile).toHaveBeenCalledWith({
      type: "PERSONAL",
      label: "Evening look",
      notes: undefined,
      referenceImages: ["users/user-1/uploads/upl_mock.jpg"],
    });
  });

  it("shows a Premium upgrade prompt when otherAi is off", async () => {
    renderCreate(createOtherAiOffResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Virtual Profile edits need Premium",
      }),
    ).toBeInTheDocument();
  });

  it("shows a Premium upgrade prompt when aiTryOn is off", async () => {
    renderCreate(createAiTryOnOffResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Virtual Profile edits need Premium",
      }),
    ).toBeInTheDocument();
  });

  it("renders an error state when entitlements cannot be loaded", async () => {
    renderCreate(createErrorResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Couldn't save this Virtual Profile",
      }),
    ).toBeInTheDocument();
  });

  it("does not offer an edit form for a preset Virtual Profile", async () => {
    renderEdit("aip_model01", createMockResourceApi());

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Virtual Profile not found",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save changes" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Photo")).not.toBeInTheDocument();
  });

  it("edits an existing Virtual Profile", async () => {
    const user = userEvent.setup();
    const updateAiProfile = vi.fn().mockResolvedValue({
      aiProfileId: "aip_personal01",
      type: "PERSONAL",
      referenceImages: [],
      status: "READY",
      createdAt: "2026-09-01T12:00:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
      label: "Updated look",
    });
    renderEdit(
      "aip_personal01",
      createMockResourceApi({ updateAiProfile }),
    );

    const nameField = await screen.findByLabelText("Name");
    await user.clear(nameField);
    await user.type(nameField, "Updated look");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateAiProfile).toHaveBeenCalledWith("aip_personal01", {
      label: "Updated look",
      notes: "Used for Virtual Try On on weekdays.",
    });
  });
});
