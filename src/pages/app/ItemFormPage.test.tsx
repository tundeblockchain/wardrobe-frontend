import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { catalogLimitError } from "../../api/catalogLimits";
import { ApiError } from "../../api/httpClient";
import {
  createErrorResourceApi,
  createFreeAtLimitResourceApi,
  createMockResourceApi,
} from "../../api/mockResourceApi";
import type { ResourceApi } from "../../api/resourceApi";
import { appPaths, getAppItemNewPath } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ItemFormPage } from "./ItemFormPage";

const photo = new File(["photo-bytes"], "tee.jpg", { type: "image/jpeg" });

const renderCreate = (
  wardrobeId: string,
  resourceApi: ResourceApi,
  putFile = vi.fn().mockResolvedValue(undefined),
) => {
  return renderWithProviders(
    <Routes>
      <Route
        path={appPaths.appWardrobeItemNew}
        element={
          <ItemFormPage
            mode="create"
            resourceApi={resourceApi}
            putFile={putFile}
          />
        }
      />
    </Routes>,
    {
      route: getAppItemNewPath(wardrobeId),
      auth: { user: { id: "user-1" } },
    },
  );
};

describe("ItemFormPage", () => {
  it("renders a loading state", () => {
    renderCreate(
      "wd_weekend01",
      createMockResourceApi({
        getMe: () => new Promise(() => undefined),
      }),
    );

    expect(
      screen.getByRole("status", { name: "Loading clothing item" }),
    ).toBeInTheDocument();
  });

  it("validates required fields before upload or create", async () => {
    const user = userEvent.setup();
    const createItem = vi.fn();
    const createUpload = vi.fn();
    const putFile = vi.fn();
    renderCreate(
      "wd_weekend01",
      createMockResourceApi({ createItem, createUpload }),
      putFile,
    );

    await user.click(await screen.findByRole("button", { name: "Save item" }));

    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("A photo is required.")).toBeInTheDocument();
    expect(createUpload).not.toHaveBeenCalled();
    expect(putFile).not.toHaveBeenCalled();
    expect(createItem).not.toHaveBeenCalled();
  });

  it("uploads via a presigned URL then creates the item", async () => {
    const user = userEvent.setup();
    const createUpload = vi.fn().mockResolvedValue({
      uploadUrl: "https://uploads.example.com/presigned/jpg",
      objectKey: "users/user-1/uploads/upl_1.jpg",
      expiresIn: 900,
    });
    const createItem = vi.fn().mockResolvedValue({
      itemId: "item_new",
      wardrobeId: "wd_weekend01",
      name: "Navy tee",
      category: "TOP",
      processingStatus: "READY",
      createdAt: "2026-10-13T12:00:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
    });
    const putFile = vi.fn().mockResolvedValue(undefined);
    renderCreate(
      "wd_weekend01",
      createMockResourceApi({ createUpload, createItem }),
      putFile,
    );

    await user.type(
      await screen.findByRole("textbox", { name: "Name" }),
      "Navy tee",
    );
    await user.click(screen.getByRole("combobox", { name: "Category" }));
    await user.click(await screen.findByRole("option", { name: "Top" }));
    await user.upload(screen.getByLabelText("Photo"), photo);
    await user.click(screen.getByRole("button", { name: "Save item" }));

    await waitFor(() => {
      expect(createUpload).toHaveBeenCalledWith({
        contentType: "image/jpeg",
        purpose: "WARDROBE_ITEM",
        contentLength: photo.size,
      });
      expect(putFile).toHaveBeenCalledWith({
        uploadUrl: "https://uploads.example.com/presigned/jpg",
        file: photo,
        contentType: "image/jpeg",
      });
      expect(createItem).toHaveBeenCalledWith("wd_weekend01", {
        name: "Navy tee",
        category: "TOP",
        imageKey: "users/user-1/uploads/upl_1.jpg",
      });
    });
  });

  it("shows a clear error when the S3 PUT fails", async () => {
    const user = userEvent.setup();
    const createItem = vi.fn();
    const putFile = vi.fn().mockRejectedValue(
      new ApiError({
        status: 403,
        code: "UPLOAD_FAILED",
        message: "The photo could not be uploaded. Try again.",
      }),
    );
    renderCreate(
      "wd_weekend01",
      createMockResourceApi({ createItem }),
      putFile,
    );

    await user.type(
      await screen.findByRole("textbox", { name: "Name" }),
      "Navy tee",
    );
    await user.click(screen.getByRole("combobox", { name: "Category" }));
    await user.click(await screen.findByRole("option", { name: "Top" }));
    await user.upload(screen.getByLabelText("Photo"), photo);
    await user.click(screen.getByRole("button", { name: "Save item" }));

    expect(
      await screen.findByText(/Couldn't upload this photo/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The photo did not upload. Check the file and try again/),
    ).toBeInTheDocument();
    expect(createItem).not.toHaveBeenCalled();
  });

  it("shows the upgrade prompt before a Free user hits the item limit", async () => {
    renderCreate("wd_weekend01", createFreeAtLimitResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Clothing item limit reached",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View plan to add more clothing items" }),
    ).toHaveAttribute("href", appPaths.appPlan);
    expect(
      screen.queryByRole("button", { name: "Save item" }),
    ).not.toBeInTheDocument();
  });

  it("reads clothing item limit copy from the /me entitlement", async () => {
    renderCreate(
      "wd_weekend01",
      createFreeAtLimitResourceApi(
        {},
        { limits: { wardrobes: 3, items: 12, outfits: 20 } },
      ),
    );

    expect(
      await screen.findByText(
        "You've used 12 of 12 clothing items. Upgrade your plan to add another.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the same upgrade prompt when create returns 403 after going over the limit", async () => {
    const user = userEvent.setup();
    const createItem = vi.fn().mockRejectedValue(catalogLimitError("item"));
    const putFile = vi.fn().mockResolvedValue(undefined);
    renderCreate(
      "wd_weekend01",
      createMockResourceApi({ createItem }),
      putFile,
    );

    await user.type(
      await screen.findByRole("textbox", { name: "Name" }),
      "Navy tee",
    );
    await user.click(screen.getByRole("combobox", { name: "Category" }));
    await user.click(await screen.findByRole("option", { name: "Top" }));
    await user.upload(screen.getByLabelText("Photo"), photo);
    await user.click(screen.getByRole("button", { name: "Save item" }));

    expect(
      await screen.findByRole("heading", {
        name: "Clothing item limit reached",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This plan has reached its clothing item limit. Upgrade your plan to add another.",
      ),
    ).toBeInTheDocument();
  });

  it("renders an error state when entitlements cannot be loaded", async () => {
    renderCreate("wd_weekend01", createErrorResourceApi());

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Couldn't save this item",
      }),
    ).toBeInTheDocument();
  });
});
