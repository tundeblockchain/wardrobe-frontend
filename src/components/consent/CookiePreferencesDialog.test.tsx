import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { CookiePreferencesDialog } from "./CookiePreferencesDialog";

describe("CookiePreferencesDialog", () => {
  it("shows essential always on and optional toggles off by default", () => {
    renderWithProviders(
      <CookiePreferencesDialog
        open
        initialFlags={{ analytics: false, marketing: false }}
        onClose={() => undefined}
        onSave={() => undefined}
        onAcceptAll={() => undefined}
        onRejectAll={() => undefined}
      />,
    );

    const essential = screen.getByRole("switch", { name: /Essential/ });
    const analytics = screen.getByRole("switch", { name: /Analytics/ });
    const marketing = screen.getByRole("switch", { name: /Marketing/ });

    expect(essential).toBeChecked();
    expect(essential).toBeDisabled();
    expect(analytics).not.toBeChecked();
    expect(marketing).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: "Accept all cookies" }),
    ).toHaveClass("MuiButton-contained");
    expect(
      screen.getByRole("button", { name: "Reject all optional cookies" }),
    ).toHaveClass("MuiButton-contained");
  });

  it("saves the selected toggles", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    renderWithProviders(
      <CookiePreferencesDialog
        open
        initialFlags={{ analytics: false, marketing: false }}
        onClose={() => undefined}
        onSave={onSave}
        onAcceptAll={() => undefined}
        onRejectAll={() => undefined}
      />,
    );

    await user.click(screen.getByRole("switch", { name: /Analytics/ }));
    await user.click(screen.getByRole("button", { name: "Save cookie preferences" }));

    expect(onSave).toHaveBeenCalledWith({ analytics: true, marketing: false });
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <CookiePreferencesDialog
        open
        initialFlags={{ analytics: false, marketing: false }}
        onClose={onClose}
        onSave={() => undefined}
        onAcceptAll={() => undefined}
        onRejectAll={() => undefined}
      />,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
