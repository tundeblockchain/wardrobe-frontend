import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePage } from "./HomePage";
import { renderWithProviders } from "../test/renderWithProviders";

describe("HomePage", () => {
  it("renders the scaffold heading and status", () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Digital Wardrobe" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ready for the next tickets" }),
    ).toBeInTheDocument();
  });
});
