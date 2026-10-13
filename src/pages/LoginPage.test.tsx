import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../test/renderWithProviders";
import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  it("renders the sign-in placeholder", () => {
    renderWithProviders(<LoginPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Account sign-in will be connected in a later update/),
    ).toBeInTheDocument();
  });
});
