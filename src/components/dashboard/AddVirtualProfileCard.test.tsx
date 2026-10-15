import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { appPaths } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ADD_VIRTUAL_PROFILE_CARD_TEST_ID, AddVirtualProfileCard } from "./AddVirtualProfileCard";

describe("AddVirtualProfileCard", () => {
  it("links to Add Virtual Profile from a picture card", () => {
    renderWithProviders(<AddVirtualProfileCard />);

    const card = screen.getByRole("link", { name: "Add a Virtual Profile" });
    expect(card).toHaveAttribute("href", appPaths.appVirtualProfileNew);
    expect(card).toHaveAttribute("data-testid", ADD_VIRTUAL_PROFILE_CARD_TEST_ID);
    expect(card).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("Add Virtual Profile")).toBeInTheDocument();
    expect(card).toHaveClass("MuiPaper-elevation1");
  });

  it("activates from the keyboard with Space", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddVirtualProfileCard />);

    const card = screen.getByRole("link", { name: "Add a Virtual Profile" });
    card.focus();
    await user.keyboard(" ");

    expect(card).toHaveFocus();
  });
});
