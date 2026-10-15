import type { ComponentProps } from "react";
import { ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { appTheme } from "../../theme/appTheme";
import { renderWithProviders } from "../../test/renderWithProviders";
import { SelectableResourceCard } from "./SelectableResourceCard";

const renderCard = (
  overrides: Partial<ComponentProps<typeof SelectableResourceCard>> = {},
) => {
  const onSelect = overrides.onSelect ?? vi.fn();
  renderWithProviders(
    <SelectableResourceCard
      title="Weekday look"
      titleId="profile-weekday-title"
      imageUrl="/screenshots/try-on-blue-mini-390.jpg"
      imageAlt="Weekday look"
      fallbackLabel="No photo for this Virtual Profile"
      selected={false}
      selection="single"
      onSelect={onSelect}
      {...overrides}
    />,
  );
  return { onSelect };
};

describe("SelectableResourceCard", () => {
  it("toggles a single-select card from the keyboard", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderCard();

    const card = screen.getByRole("button", { name: "Weekday look" });
    expect(card).toHaveAttribute("aria-pressed", "false");
    expect(card).toHaveAttribute("tabindex", "0");
    card.focus();
    await user.keyboard(" ");
    expect(onSelect).toHaveBeenCalledTimes(1);
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("exposes multi-select cards as checkboxes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderCard({
      title: "Navy tee",
      titleId: "item-navy-title",
      imageAlt: "Navy tee",
      selection: "multi",
      selected: true,
      onSelect,
    });

    const card = screen.getByRole("checkbox", { name: "Navy tee" });
    expect(card).toHaveAttribute("aria-checked", "true");
    expect(card).toHaveAttribute("data-selected", "true");
    await user.click(card);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("highlights the selected card with theme tokens in light and dark", () => {
    const { unmount } = renderWithProviders(
      <SelectableResourceCard
        title="Sunday brunch"
        titleId="outfit-brunch-title"
        imageAlt="Sunday brunch"
        fallbackLabel="No photo for this outfit"
        selected
        selection="single"
        onSelect={() => undefined}
      />,
    );

    const lightCard = screen.getByRole("button", { name: "Sunday brunch" });
    expect(lightCard).toHaveAttribute("data-selected", "true");
    expect(lightCard).toHaveStyle({
      borderColor: appTheme.palette.primary.main,
    });
    unmount();

    const darkTheme = createTheme({
      palette: {
        mode: "dark",
        primary: appTheme.palette.primary,
      },
    });
    renderWithProviders(
      <ThemeProvider theme={darkTheme}>
        <SelectableResourceCard
          title="Sunday brunch"
          titleId="outfit-brunch-title"
          imageAlt="Sunday brunch"
          fallbackLabel="No photo for this outfit"
          selected
          selection="single"
          onSelect={() => undefined}
        />
      </ThemeProvider>,
    );

    const darkCard = screen.getByRole("button", { name: "Sunday brunch" });
    expect(darkCard).toHaveStyle({
      borderColor: darkTheme.palette.primary.main,
    });
  });

  it("provides alt text for the card photo", () => {
    renderCard();

    expect(screen.getByRole("img", { name: "Weekday look" })).toHaveAttribute(
      "src",
      "/screenshots/try-on-blue-mini-390.jpg",
    );
  });

  it("uses a slight theme shadow on picture cards", () => {
    renderCard();

    expect(screen.getByRole("button", { name: "Weekday look" })).toHaveClass(
      "MuiPaper-elevation1",
    );
  });

  it("does not select when disabled", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderCard({ disabled: true });

    const card = screen.getByRole("button", { name: "Weekday look" });
    expect(card).toBeDisabled();
    await user.click(card);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
