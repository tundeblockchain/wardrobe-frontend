import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createEmptyResourceApi,
  createErrorResourceApi,
  createMockResourceApi,
} from "../../api/mockResourceApi";
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
        listAiProfiles: () => new Promise(() => undefined),
      }),
    );

    expect(
      screen.getByRole("status", { name: "Loading Virtual Profiles" }),
    ).toBeInTheDocument();
  });

  it("renders Virtual Profiles and Virtual Try On copy from the mock API", async () => {
    renderPage(createMockResourceApi());

    expect(
      await screen.findByRole("heading", { level: 1, name: "Virtual Profiles" }),
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
      screen.getByRole("heading", { name: "Catalog model" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Weekday look" })).toHaveAttribute(
      "src",
      "/screenshots/try-on-blue-mini-390.jpg",
    );
  });

  it("renders an empty Virtual Profiles state", async () => {
    renderPage(createEmptyResourceApi());

    expect(
      await screen.findByRole("heading", { name: "No Virtual Profiles yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Create a Virtual Profile in the app to preview looks with Virtual Try On/,
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
});
