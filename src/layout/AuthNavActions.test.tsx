import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../test/renderWithProviders";
import { appPaths, getLoginSignupPath } from "../routes/paths";
import { AuthNavActions } from "./AuthNavActions";

describe("AuthNavActions", () => {
  it("shows Log in and Sign up when signed out", () => {
    renderWithProviders(<AuthNavActions layout="toolbar" />);

    const accountNav = screen.getByRole("navigation", { name: "Account" });
    expect(accountNav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      appPaths.login,
    );
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      getLoginSignupPath(),
    );
    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
  });

  it("keeps Log in and Sign up while auth is still loading", () => {
    renderWithProviders(<AuthNavActions layout="toolbar" />, {
      auth: { loading: true },
    });

    expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
  });

  it("shows Dashboard instead of Log in and Sign up when signed in", () => {
    renderWithProviders(<AuthNavActions layout="toolbar" />, {
      auth: { user: { id: "user-1" } },
    });

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      appPaths.app,
    );
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Sign up" }),
    ).not.toBeInTheDocument();
  });
});
