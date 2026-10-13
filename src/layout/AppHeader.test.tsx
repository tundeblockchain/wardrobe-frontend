import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppHeader } from "./AppHeader";
import { renderWithProviders } from "../test/renderWithProviders";
import { appPaths, getLoginSignupPath } from "../routes/paths";

const getHeaderAccountNav = () => {
  const header = screen.getByRole("banner");
  return within(header).getByRole("navigation", { name: "Account" });
};

describe("AppHeader", () => {
  it("renders the brand home link and section navigation without legal links", () => {
    renderWithProviders(<AppHeader />);

    const header = screen.getByRole("banner");
    expect(
      screen.getByRole("link", { name: "Pocket Closet home" }),
    ).toHaveAttribute("href", appPaths.home);
    expect(screen.getByRole("link", { name: "Jump to features" })).toHaveAttribute(
      "href",
      "/#features",
    );
    expect(
      screen.getByRole("link", { name: "Jump to screenshot showcase" }),
    ).toHaveAttribute("href", "/#screenshots");
    expect(screen.getByRole("link", { name: "Jump to download" })).toHaveAttribute(
      "href",
      "/#download",
    );
    expect(
      within(header).queryByRole("link", { name: "Terms of Service" }),
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole("link", { name: "Privacy Policy" }),
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole("link", { name: "Contact us" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Pocket Closet home" }).querySelector("img"),
    ).toHaveAttribute("src", "/logo.png");
  });

  it("shows Log in and Sign up in the header when signed out", () => {
    renderWithProviders(<AppHeader />);

    const accountNav = getHeaderAccountNav();
    expect(within(accountNav).getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      appPaths.login,
    );
    expect(within(accountNav).getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      getLoginSignupPath(),
    );
    expect(
      within(accountNav).queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
  });

  it("shows Dashboard in the header when signed in", () => {
    renderWithProviders(<AppHeader />, {
      auth: { user: { id: "user-1" } },
    });

    const accountNav = getHeaderAccountNav();
    expect(
      within(accountNav).getByRole("link", { name: "Dashboard" }),
    ).toHaveAttribute("href", appPaths.app);
    expect(
      within(accountNav).queryByRole("link", { name: "Log in" }),
    ).not.toBeInTheDocument();
    expect(
      within(accountNav).queryByRole("link", { name: "Sign up" }),
    ).not.toBeInTheDocument();
  });

  it("shows Log in and Sign up in the mobile menu when signed out", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppHeader />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const mobileMenu = await screen.findByLabelText("Mobile menu");
    expect(within(mobileMenu).getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      appPaths.login,
    );
    expect(
      within(mobileMenu).getByRole("link", { name: "Sign up" }),
    ).toHaveAttribute("href", getLoginSignupPath());
    expect(
      within(mobileMenu).queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
    expect(
      within(mobileMenu).queryByRole("link", { name: "Terms of Service" }),
    ).not.toBeInTheDocument();
    expect(
      within(mobileMenu).queryByRole("link", { name: "Privacy Policy" }),
    ).not.toBeInTheDocument();
    expect(
      within(mobileMenu).queryByRole("link", { name: "Contact us" }),
    ).not.toBeInTheDocument();
  });

  it("shows Dashboard in the mobile menu when signed in", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppHeader />, {
      auth: { user: { id: "user-1" } },
    });

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const mobileMenu = await screen.findByLabelText("Mobile menu");
    expect(
      within(mobileMenu).getByRole("link", { name: "Dashboard" }),
    ).toHaveAttribute("href", appPaths.app);
    expect(
      within(mobileMenu).queryByRole("link", { name: "Log in" }),
    ).not.toBeInTheDocument();
    expect(
      within(mobileMenu).queryByRole("link", { name: "Sign up" }),
    ).not.toBeInTheDocument();
  });
});
