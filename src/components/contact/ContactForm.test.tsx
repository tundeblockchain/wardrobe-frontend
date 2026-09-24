import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CONTACT_STATUS_MESSAGES } from "../../api/contact";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ContactForm } from "./ContactForm";

const getNameField = () => screen.getByRole("textbox", { name: "Name" });
const getEmailField = () => screen.getByRole("textbox", { name: "Email" });
const getSubjectField = () => screen.getByRole("textbox", { name: "Subject" });
const getMessageField = () => screen.getByRole("textbox", { name: "Message" });

const fillRequiredFields = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
  await user.type(getNameField(), "Ada Lovelace");
  await user.type(getEmailField(), "ada@example.com");
  await user.type(getMessageField(), "How do I catalog coats?");
};

describe("ContactForm", () => {
  it("validates required fields and a basic email before submitting", async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn();

    renderWithProviders(
      <ContactForm
        appName="Pocket Closet"
        apiBaseUrl="https://api.example.com"
        sendMessage={sendMessage}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Send contact message" }),
    );

    expect(screen.getByText("Enter your name.")).toBeInTheDocument();
    expect(screen.getByText("Enter your email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter a message.")).toBeInTheDocument();
    expect(
      screen.getByText(CONTACT_STATUS_MESSAGES.validation),
    ).toBeInTheDocument();
    expect(sendMessage).not.toHaveBeenCalled();

    await user.type(getNameField(), "Ada");
    await user.type(getEmailField(), "not-an-email");
    await user.type(getMessageField(), "Hello");
    await user.click(
      screen.getByRole("button", { name: "Send contact message" }),
    );

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("shows a thank-you state after a successful submit", async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn().mockResolvedValue({ status: "success" });

    renderWithProviders(
      <ContactForm
        appName="Pocket Closet"
        apiBaseUrl="https://api.example.com"
        sendMessage={sendMessage}
      />,
    );

    await fillRequiredFields(user);
    await user.type(getSubjectField(), "Store listing");
    await user.click(
      screen.getByRole("button", { name: "Send contact message" }),
    );

    expect(
      await screen.findByText(
        "Thanks for contacting Pocket Closet. We received your message and will reply if a response is needed.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("form", { name: "Contact form" }),
    ).not.toBeInTheDocument();
    expect(sendMessage).toHaveBeenCalledWith({
      apiBaseUrl: "https://api.example.com",
      fields: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        subject: "Store listing",
        message: "How do I catalog coats?",
        company: "",
      },
    });

    await user.click(
      screen.getByRole("button", { name: "Send another contact message" }),
    );

    expect(
      screen.getByRole("form", { name: "Contact form" }),
    ).toBeInTheDocument();
    expect(getNameField()).toHaveValue("");
  });

  it("maps a 400 validation result onto fields and an error alert", async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn().mockResolvedValue({
      status: "validation",
      message: CONTACT_STATUS_MESSAGES.validation,
      fieldErrors: { email: "Please check this field." },
    });

    renderWithProviders(
      <ContactForm
        appName="Pocket Closet"
        apiBaseUrl="https://api.example.com"
        sendMessage={sendMessage}
      />,
    );

    await fillRequiredFields(user);
    await user.click(
      screen.getByRole("button", { name: "Send contact message" }),
    );

    expect(
      await screen.findByText(CONTACT_STATUS_MESSAGES.validation),
    ).toBeInTheDocument();
    expect(screen.getByText("Please check this field.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send contact message" }),
    ).toBeEnabled();
  });

  it("explains a 429 rate limit using Retry-After minutes", async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn().mockResolvedValue({
      status: "rateLimited",
      retryAfterSeconds: 180,
    });

    renderWithProviders(
      <ContactForm
        appName="Pocket Closet"
        apiBaseUrl="https://api.example.com"
        sendMessage={sendMessage}
      />,
    );

    await fillRequiredFields(user);
    await user.click(
      screen.getByRole("button", { name: "Send contact message" }),
    );

    expect(
      await screen.findByText(
        "You've sent too many messages. Please try again in about 3 minutes.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a generic error for 5xx or network failures", async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn().mockResolvedValue({
      status: "error",
      message: CONTACT_STATUS_MESSAGES.generic,
    });

    renderWithProviders(
      <ContactForm
        appName="Pocket Closet"
        apiBaseUrl="https://api.example.com"
        sendMessage={sendMessage}
      />,
    );

    await fillRequiredFields(user);
    await user.click(
      screen.getByRole("button", { name: "Send contact message" }),
    );

    expect(
      await screen.findByText(CONTACT_STATUS_MESSAGES.generic),
    ).toBeInTheDocument();
  });

  it("renders a hidden honeypot field that is not in the tab order", () => {
    renderWithProviders(
      <ContactForm
        appName="Pocket Closet"
        apiBaseUrl="https://api.example.com"
      />,
    );

    const honeypot = document.querySelector('input[name="company"]');
    expect(honeypot).toBeTruthy();
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot).toHaveAttribute("autocomplete", "off");
    expect(honeypot).toHaveAttribute("aria-hidden", "true");
    expect(
      screen.queryByRole("textbox", { name: "Company" }),
    ).not.toBeInTheDocument();
    expect(document.querySelector('[data-honeypot="company"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("renders a non-crashing notice and disables submit when the API base is unset", async () => {
    const user = userEvent.setup();
    const sendMessage = vi.fn();

    renderWithProviders(
      <ContactForm
        appName="Pocket Closet"
        apiBaseUrl={undefined}
        sendMessage={sendMessage}
      />,
    );

    expect(
      screen.getByText(CONTACT_STATUS_MESSAGES.misconfigured),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send contact message" }),
    ).toBeDisabled();
    expect(getNameField()).toBeInTheDocument();

    await user.type(getNameField(), "Ada");
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
