import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  createEmptyResourceApi,
  createErrorResourceApi,
  createMockResourceApi,
} from "../../api/mockResourceApi";
import { getAppWardrobePath } from "../../routes/paths";
import {
  expectActionButtonNotFullWidth,
  expectInsideNarrowContent,
} from "../../test/dashboardNarrowContentTest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { WardrobesPage } from "./WardrobesPage";

const renderPage = (
  resourceApi: ReturnType<typeof createMockResourceApi>,
) => {
  return renderWithProviders(<WardrobesPage resourceApi={resourceApi} />, {
    auth: { user: { id: "user-1" } },
  });
};

const pendingApi = createMockResourceApi({
  listWardrobes: () => new Promise(() => undefined),
});

describe("WardrobesPage", () => {
  it("renders a loading state", () => {
    renderPage(pendingApi);

    expect(
      screen.getByRole("heading", { level: 1, name: "Wardrobes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Loading wardrobes" }),
    ).toBeInTheDocument();
  });

  it("renders wardrobe cards from the mock API", async () => {
    renderPage(createMockResourceApi());

    expect(
      await screen.findByRole("heading", { level: 1, name: "Wardrobes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Weekend closet" }),
    ).toHaveAttribute("href", getAppWardrobePath("wd_weekend01"));
    expect(screen.getByRole("link", { name: "Workwear" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Add a wardrobe" }),
    ).toHaveAttribute("href", "/app/wardrobes/new");
    expect(
      screen.queryByRole("button", { name: /delete/i }),
    ).not.toBeInTheDocument();
  });

  it("renders an empty state when there are no wardrobes", async () => {
    renderPage(createEmptyResourceApi());

    expectInsideNarrowContent(
      await screen.findByRole("heading", { name: "No wardrobes yet" }),
    );
    expectActionButtonNotFullWidth(
      screen.getByRole("link", { name: "Add a wardrobe" }),
    );
  });

  it("renders an error state and retries", async () => {
    const user = userEvent.setup();
    renderPage(createErrorResourceApi());

    expect(
      await screen.findByRole("heading", { name: "Couldn't load wardrobes" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Try loading wardrobes again" }),
    );
    expect(
      screen.getByRole("heading", { name: "Couldn't load wardrobes" }),
    ).toBeInTheDocument();
  });
});
