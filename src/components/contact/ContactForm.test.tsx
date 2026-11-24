import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CONTACT_STATUS_MESSAGES } from "../../api/contact";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ContactForm } from "./ContactForm";

const getEmailField = () => screen.getByRole("textbox", { name: "Email" });
const getMessageField = () => screen.getByRole("textbox", { name: "Message" });

const fillRequiredFields = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
  await user.type(getEmailField(), "ada@example.com");
  await user.type(getMessageField(), "How do I catalog coats?");
};

describe("ContactForm", () => {
  it("validates required fields and a basic email before submitting", async () => {
    const user = userEvent.setup();
    const submitFeedback = vi.fn();

    renderWithProviders(
      <ContactForm
        appName="Pocket Closet"
        apiBaseUrl="https://api.example.com"
        submitFeedback={submitFeedback}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Send contact message" }),
    );

    expect(screen.getByText("Enter your email address.")).toBeInTheDocument();
    expect(screen.getByText(/Enter a message/)).toBeInTheDocument();
    expect(
      screen.getByText(CONTACT_STATUS_MESSAGES.validation),
    ).toBeInTheDocument();
    expect(submitFeedback).not.toHaveBeenCalled();

    await user.type(getEmailField(), "not-an-email");
    await user.type(getMessageField(), "Hello");
    await user.click(
      screen.getByRole("button", { name: "Send contact message" }),
    );

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(submitFeedback).not.toHaveBeenCalled();
  });

  it("shows a thank-you state after a successful submit and resets the form", async () => {
    const user = userEvent.setup();
    const submitFeedback = vi.fn().mockResolvedValue({
      status: "success",
      conversationId: "conv_abc123",
    });

    renderWithProviders(
      <ContactForm
        appName="Pocket Closet"
        apiBaseUrl="https://api.example.com"
        submitFeedback={submitFeedback}
      />,
    );

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Bug report" }));
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
    expect(submitFeedback).toHaveBeenCalledWith({
      apiBaseUrl: "https://api.example.com",
      fields: {
        type: "bug",
        email: "ada@example.com",
        message: "How do I catalog coats?",
        website: "",
      },
      screenshotFile: undefined,
      userAgent: expect.any(String),
    });

    await user.click(
      screen.getByRole("button", { name: "Send another contact message" }),
    );

    expect(
      screen.getByRole("form", { name: "Contact form" }),
    ).toBeInTheDocument();
    expect(getEmailField()).toHaveValue("");
  });

  it("maps a 400 validation result onto fields and an error alert", async () => {
    const user = userEvent.setup();
    const submitFeedback = vi.fn().mockResolvedValue({
      status: "validation",
      message: CONTACT_STATUS_MESSAGES.validation,
      fieldErrors: { email: "Please check this field." },
    });

    renderWithProviders(
      <ContactForm
        appName="Pocket Closet"
        apiBaseUrl="https://api.example.com"
        submitFeedback={submitFeedback}
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

  it("explains a 429 rate limit using retry minutes", async () => {
    const user = userEvent.setup();
    const submitFeedback = vi.fn().mockResolvedValue({
      status: "rateLimited",
      retryAfterSeconds: 180,
    });

    renderWithProviders(
      <ContactForm
        appName="Pocket Closet"
        apiBaseUrl="https://api.example.com"
        submitFeedback={submitFeedback}
      />,
    );

    await fillRequiredFields(user);
    await user.click(
      screen.getByRole("button", { name: "Send contact message" }),
    );

    expect(
      await screen.findByText(
        "Too many requests. Please try again in 3 minutes.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a generic error for 5xx or network failures", async () => {
    const user = userEvent.setup();
    const submitFeedback = vi.fn().mockResolvedValue({
      status: "error",
      message: CONTACT_STATUS_MESSAGES.generic,
    });

    renderWithProviders(
      <ContactForm
        appName="Pocket Closet"
        apiBaseUrl="https://api.example.com"
        submitFeedback={submitFeedback}
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

  it("renders a hidden website honeypot that is not in the tab order", () => {
    renderWithProviders(
      <ContactForm
        appName="Pocket Closet"
        apiBaseUrl="https://api.example.com"
      />,
    );

    const honeypot = document.querySelector('input[name="website"]');
    expect(honeypot).toBeTruthy();
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot).toHaveAttribute("autocomplete", "off");
    expect(honeypot).toHaveAttribute("aria-hidden", "true");
    expect(
      screen.queryByRole("textbox", { name: "Website" }),
    ).not.toBeInTheDocument();
    expect(document.querySelector('[data-honeypot="website"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("renders a non-crashing notice and disables submit when the API base is unset", async () => {
    const user = userEvent.setup();
    const submitFeedback = vi.fn();

    renderWithProviders(
      <ContactForm
        appName="Pocket Closet"
        apiBaseUrl={undefined}
        submitFeedback={submitFeedback}
      />,
    );

    expect(
      screen.getByText(CONTACT_STATUS_MESSAGES.misconfigured),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send contact message" }),
    ).toBeDisabled();
    expect(getEmailField()).toBeInTheDocument();

    await user.type(getEmailField(), "Ada");
    expect(submitFeedback).not.toHaveBeenCalled();
  });

  it("prefills Bug report when the initial type is bug", () => {
    renderWithProviders(
      <ContactForm
        appName="Pocket Closet"
        apiBaseUrl="https://api.example.com"
        initialType="bug"
      />,
    );

    expect(screen.getByRole("button", { name: "Bug report" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("rejects the wrong screenshot type on the client before submit", () => {
    const submitFeedback = vi.fn();

    renderWithProviders(
      <ContactForm
        appName="Pocket Closet"
        apiBaseUrl="https://api.example.com"
        submitFeedback={submitFeedback}
      />,
    );

    const fileInput = document.querySelector(
      'input[name="screenshot"]',
    ) as HTMLInputElement;
    const gif = new File(["gif"], "notes.gif", { type: "image/gif" });
    fireEvent.change(fileInput, { target: { files: [gif] } });

    expect(
      screen.getByText(CONTACT_STATUS_MESSAGES.screenshotType),
    ).toBeInTheDocument();
    expect(submitFeedback).not.toHaveBeenCalled();
  });
});
