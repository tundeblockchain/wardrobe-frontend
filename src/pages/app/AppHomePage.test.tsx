import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { AppHomePage } from "./AppHomePage";

describe("AppHomePage", () => {
  it("renders the signed-in app home placeholder", () => {
    renderWithProviders(<AppHomePage />, {
      auth: { user: { id: "user-1", email: "user@example.com" } },
    });

    expect(
      screen.getByRole("heading", { level: 1, name: "Your closet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open Wardrobes, Outfits, Virtual Profiles, or Plan/),
    ).toBeInTheDocument();
  });
});
