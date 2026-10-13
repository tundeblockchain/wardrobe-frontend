import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  createAiTryOnOffResourceApi,
  createEntitlementAiRequiredResourceApi,
  createErrorResourceApi,
  createMockResourceApi,
} from "../../api/mockResourceApi";
import { appPaths } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { VirtualTryOnPage } from "./VirtualTryOnPage";

const renderPage = (
  resourceApi: ReturnType<typeof createMockResourceApi>,
) => {
  return renderWithProviders(<VirtualTryOnPage resourceApi={resourceApi} />, {
    auth: { user: { id: "user-1" } },
  });
};

describe("VirtualTryOnPage", () => {
  it("renders a loading state", () => {
    renderPage(
      createMockResourceApi({
        getMe: () => new Promise(() => undefined),
      }),
    );

    expect(
      screen.getByRole("status", { name: "Loading Virtual Try On" }),
    ).toBeInTheDocument();
  });

  it("starts a Virtual Try On render for selected items and shows the gallery", async () => {
    const user = userEvent.setup();
    const renderItem = vi.fn().mockResolvedValue({
      itemId: "item_navytee01",
      wardrobeId: "wd_weekend01",
      name: "Navy tee",
      category: "TOP",
      processingStatus: "READY",
      createdAt: "2026-09-03T18:40:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
      renderImageUrls: ["/screenshots/try-on-started.jpg"],
      renderHistory: [
        {
          imageKey: "users/user-1/renders/rend_new.png",
          createdAt: "2026-10-13T18:00:00.000Z",
          aiProfileId: "aip_personal01",
          imageUrl: "/screenshots/try-on-started.jpg",
        },
      ],
    });
    renderPage(createMockResourceApi({ renderItem }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Virtual Try On" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-ivory-maxi-390.jpg");

    await user.click(screen.getByLabelText("Navy tee"));
    await user.click(
      screen.getByRole("button", { name: "Start Virtual Try On" }),
    );

    expect(renderItem).toHaveBeenCalledWith("wd_weekend01", "item_navytee01", {
      aiProfileId: "aip_personal01",
    });
    expect(
      await screen.findByRole("img", { name: "Virtual Try On render 1" }),
    ).toHaveAttribute("src", "/screenshots/try-on-started.jpg");
  });

  it("starts a Virtual Try On render for a selected outfit", async () => {
    const user = userEvent.setup();
    const renderOutfit = vi.fn().mockResolvedValue({
      outfitId: "outfit_brunch01",
      wardrobeId: "wd_weekend01",
      name: "Sunday brunch",
      items: [],
      createdAt: "2026-09-20T14:00:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
      renderImageUrls: ["/screenshots/try-on-outfit.jpg"],
    });
    renderPage(createMockResourceApi({ renderOutfit }));

    await user.click(await screen.findByLabelText("Saved outfit"));
    await user.click(
      screen.getByRole("button", { name: "Start Virtual Try On" }),
    );

    expect(renderOutfit).toHaveBeenCalledWith(
      "wd_weekend01",
      "outfit_brunch01",
      { aiProfileId: "aip_personal01" },
    );
  });

  it("renders an upgrade prompt when /me features.aiTryOn is false", async () => {
    renderPage(createAiTryOnOffResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View plan for Virtual Try On" }),
    ).toHaveAttribute("href", appPaths.appPlan);
    expect(
      screen.queryByRole("button", { name: "Start Virtual Try On" }),
    ).not.toBeInTheDocument();
  });

  it("maps 403 ENTITLEMENT_AI_REQUIRED to a Premium upgrade prompt", async () => {
    renderPage(createEntitlementAiRequiredResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    ).toBeInTheDocument();
  });

  it("renders an error state", async () => {
    renderPage(createErrorResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Couldn't load Virtual Try On",
      }),
    ).toBeInTheDocument();
  });
});
