import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { appPaths } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { BillingCancelPage } from "./BillingCancelPage";

describe("BillingCancelPage", () => {
  it("renders the cancelled checkout copy and links back", () => {
    renderWithProviders(<BillingCancelPage />, {
      route: appPaths.appBillingCancel,
      auth: { user: { id: "user-1" } },
    });

    expect(
      screen.getByRole("heading", { level: 1, name: "Checkout cancelled" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Checkout cancelled, you have not been charged.")
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "Go to the dashboard" }),
    ).toHaveAttribute("href", appPaths.app);
    expect(
      screen.getByRole("link", { name: "Compare Free, Basic, and Premium plans" }),
    ).toHaveAttribute("href", appPaths.appPricing);
    expect(
      screen.getByRole("link", { name: "View plan in Settings" }),
    ).toHaveAttribute("href", appPaths.appSettingsPlan);
  });
});
