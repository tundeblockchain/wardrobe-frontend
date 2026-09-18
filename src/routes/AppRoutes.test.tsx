import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppShell } from "../layout/AppShell";
import { renderWithProviders } from "../test/renderWithProviders";
import { AppRoutes } from "./AppRoutes";
import { appPaths } from "./paths";

describe("AppRoutes", () => {
  it("renders Terms of Service at /terms", () => {
    renderWithProviders(
      <AppShell>
        <AppRoutes />
      </AppShell>,
      { route: appPaths.terms },
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Terms of Service" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Acceptable use" }),
    ).toBeInTheDocument();
  });

  it("renders Privacy Policy at /privacy", () => {
    renderWithProviders(
      <AppShell>
        <AppRoutes />
      </AppShell>,
      { route: appPaths.privacy },
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Children’s privacy" }),
    ).toBeInTheDocument();
  });

  it("navigates from the landing footer to both legal pages", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AppShell>
        <AppRoutes />
      </AppShell>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Your closet, beautifully organized",
      }),
    ).toBeInTheDocument();

    await user.click(
      within(screen.getByRole("navigation", { name: "Legal" })).getByRole(
        "link",
        { name: "Terms of Service" },
      ),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Terms of Service" }),
    ).toBeInTheDocument();

    await user.click(
      within(screen.getByRole("navigation", { name: "Legal" })).getByRole(
        "link",
        { name: "Privacy Policy" },
      ),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeInTheDocument();
  });
});
