import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { CookieConsentBanner } from "./CookieConsentBanner";

describe("CookieConsentBanner", () => {
  it("gives Accept all and Reject all equal visual weight", () => {
    renderWithProviders(
      <CookieConsentBanner
        onAcceptAll={() => undefined}
        onRejectAll={() => undefined}
        onManagePreferences={() => undefined}
      />,
    );

    const accept = screen.getByRole("button", { name: "Accept all cookies" });
    const reject = screen.getByRole("button", { name: "Reject all optional cookies" });

    expect(accept).toHaveClass("MuiButton-contained");
    expect(reject).toHaveClass("MuiButton-contained");
    expect(accept).toHaveClass("MuiButton-sizeMedium");
    expect(reject).toHaveClass("MuiButton-sizeMedium");
    expect(accept).toHaveClass("MuiButton-colorPrimary");
    expect(reject).toHaveClass("MuiButton-colorPrimary");
    expect(screen.getByRole("dialog", { name: "Cookies on Pocket Closet" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("is keyboard operable", async () => {
    const user = userEvent.setup();
    const onAcceptAll = vi.fn();
    const onRejectAll = vi.fn();
    const onManagePreferences = vi.fn();

    renderWithProviders(
      <CookieConsentBanner
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onManagePreferences={onManagePreferences}
      />,
    );

    await user.tab();
    await user.keyboard("{Enter}");
    expect(onRejectAll).toHaveBeenCalledTimes(1);

    await user.tab();
    await user.keyboard("{Enter}");
    expect(onAcceptAll).toHaveBeenCalledTimes(1);

    await user.tab();
    await user.keyboard("{Enter}");
    expect(onManagePreferences).toHaveBeenCalledTimes(1);
  });
});
