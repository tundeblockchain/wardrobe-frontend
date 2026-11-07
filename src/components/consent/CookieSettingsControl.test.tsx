import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import * as consent from "../../config/consent";
import { renderWithProviders } from "../../test/renderWithProviders";
import { CookieSettingsControl } from "./CookieSettingsControl";

describe("CookieSettingsControl", () => {
  it("opens cookie preferences from the footer-style link", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(consent, "openCookiePreferences");

    renderWithProviders(<CookieSettingsControl />);

    const control = screen.getByRole("button", { name: "Cookie settings" });
    await user.click(control);

    expect(openSpy).toHaveBeenCalledTimes(1);
    openSpy.mockRestore();
  });
});
