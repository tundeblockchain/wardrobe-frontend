import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  createAiTryOnOffResourceApi,
  createEmptyResourceApi,
  createEntitlementAiRequiredResourceApi,
  createErrorResourceApi,
  createMockResourceApi,
  createOtherAiOffResourceApi,
} from "../../api/mockResourceApi";
import { appPaths } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { VirtualProfilesPage } from "./VirtualProfilesPage";

const renderPage = (
  resourceApi: ReturnType<typeof createMockResourceApi>,
) => {
  return renderWithProviders(<VirtualProfilesPage resourceApi={resourceApi} />, {
    auth: { user: { id: "user-1" } },
  });
};

describe("VirtualProfilesPage", () => {
  it("renders a loading state", () => {
    renderPage(
      createMockResourceApi({
        getMe: () => new Promise(() => undefined),
      }),
    );

    expect(
      screen.getByRole("status", { name: "Loading Virtual Profiles" }),
    ).toBeInTheDocument();
  });

  it("renders Virtual Profiles and Virtual Try On copy from the mock API", async () => {
    renderPage(createMockResourceApi());

    expect(
      await screen.findByRole("heading", { name: "Weekday look" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Virtual Profiles" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Browse Virtual Profiles and preview looks with Virtual Try On/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Weekday look" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Used for Virtual Try On on weekdays.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Add a Virtual Profile" }),
    ).toHaveAttribute("href", appPaths.appVirtualProfileNew);
    expect(
      screen.getByRole("img", { name: "Weekday look" }),
    ).toHaveAttribute("src", "/screenshots/try-on-blue-mini-390.jpg");
  });

  it("renders an empty Virtual Profiles state", async () => {
    renderPage(createEmptyResourceApi());

    expect(
      await screen.findByRole("heading", { name: "No Virtual Profiles yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Add a Virtual Profile to preview looks with Virtual Try On/,
      ),
    ).toBeInTheDocument();
  });

  it("renders an error state", async () => {
    renderPage(createErrorResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Couldn't load Virtual Profiles",
      }),
    ).toBeInTheDocument();
  });

  it("renders an upgrade prompt when /me features.aiTryOn is false", async () => {
    renderPage(createAiTryOnOffResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Upgrade to Premium for Virtual Try On",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Weekday look" }),
    ).not.toBeInTheDocument();
  });

  it("renders an upgrade prompt for 403 ENTITLEMENT_AI_REQUIRED", async () => {
    renderPage(createEntitlementAiRequiredResourceApi());

    expect(
      await screen.findByRole("heading", {
        name: "Virtual Try On is a Premium feature",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Upgrade to browse Virtual Profiles and preview looks with Virtual Try On/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Upgrade to Premium for Virtual Try On",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Couldn't load Virtual Profiles" }),
    ).not.toBeInTheDocument();
  });

  it("hides write actions when otherAi is off", async () => {
    renderPage(createOtherAiOffResourceApi());

    expect(
      await screen.findByRole("heading", { name: "Weekday look" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Add a Virtual Profile" }),
    ).not.toBeInTheDocument();
  });

  it("deletes a Virtual Profile after confirm", async () => {
    const user = userEvent.setup();
    const deleteAiProfile = vi.fn().mockResolvedValue(undefined);
    renderPage(createMockResourceApi({ deleteAiProfile }));

    await user.click(
      await screen.findByRole("button", { name: "Delete Weekday look" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Delete Virtual Profile" }),
    );

    expect(deleteAiProfile).toHaveBeenCalledWith("aip_personal01");
  });
});
