import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CONTACT_STATUS_MESSAGES } from "../api/contact";
import { getPublicAppEnv } from "../config/env";
import { renderWithProviders } from "../test/renderWithProviders";
import { ContactPage } from "./ContactPage";

describe("ContactPage", () => {
  it("renders the contact form using the configured app name", () => {
    renderWithProviders(
      <ContactPage
        env={getPublicAppEnv({
          VITE_APP_NAME: "Pocket Closet",
          VITE_API_BASE_URL: "https://api.example.com",
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Contact us" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Send a message to the Pocket Closet operator/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: "Contact form" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Contact us" }).closest(
        "[data-surface]",
      ),
    ).toHaveAttribute("data-surface", "mist");
    expect(
      screen.getByRole("button", { name: "Send contact message" }),
    ).toBeEnabled();
  });

  it("stays usable and disables submit when the API base is unset", () => {
    const sendMessage = vi.fn();

    renderWithProviders(
      <ContactPage env={getPublicAppEnv({})} sendMessage={sendMessage} />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Contact us" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(CONTACT_STATUS_MESSAGES.misconfigured),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send contact message" }),
    ).toBeDisabled();
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
