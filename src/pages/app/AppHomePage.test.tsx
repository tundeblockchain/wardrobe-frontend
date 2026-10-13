import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { AppHomePage } from "./AppHomePage";

describe("AppHomePage", () => {
  it("renders the signed-in app home placeholder", () => {
    renderWithProviders(<AppHomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Your closet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Closet tools will appear here in a later update/),
    ).toBeInTheDocument();
  });
});
