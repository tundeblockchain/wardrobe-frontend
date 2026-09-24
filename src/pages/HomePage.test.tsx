import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePage } from "./HomePage";
import { renderWithProviders } from "../test/renderWithProviders";

describe("HomePage", () => {
  it("renders the landing sections and labeled screenshot slots", () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "Your closet, beautifully organized",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Made for getting dressed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "See the app" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Get Pocket Closet" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("tab", { name: "Virtual Try On screenshot" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Ivory maxi screenshot" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Blue mini screenshot" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Home screenshot" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Item detail screenshot" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Add item screenshot" }),
    ).toBeInTheDocument();

    expect(
      screen.getAllByRole("button", { name: "App Store — coming soon" }).length,
    ).toBeGreaterThan(0);
  });
});
