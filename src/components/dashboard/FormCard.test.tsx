import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectOnlySharedFormCardComponent } from "../../test/formCardTest";
import { renderWithProviders } from "../../test/renderWithProviders";
import {
  FORM_CARD_CANCEL_TEST_ID,
  FORM_CARD_HEADER_TEST_ID,
  FORM_CARD_MAX_WIDTH,
  FORM_CARD_SUBMIT_TEST_ID,
  FORM_CARD_TEST_ID,
  FormCard,
} from "./FormCard";

const renderFormCard = (
  props: Partial<Parameters<typeof FormCard>[0]> = {},
) => {
  const onCancel = props.onCancel ?? vi.fn();
  const onSubmit = props.onSubmit ?? vi.fn();

  renderWithProviders(
    <FormCard
      title={props.title ?? "Edit wardrobe"}
      onCancel={onCancel}
      submitLabel={props.submitLabel ?? "Save changes"}
      submittingLabel={props.submittingLabel}
      isSubmitting={props.isSubmitting}
      isSubmitDisabled={props.isSubmitDisabled}
      cancelLabel={props.cancelLabel}
      cancelAriaLabel={props.cancelAriaLabel}
      onSubmit={onSubmit}
    >
      {props.children ?? <p>Form fields</p>}
    </FormCard>,
  );

  return { onCancel, onSubmit };
};

describe("FormCard", () => {
  it("renders the title, fields, and a centred paper card", () => {
    renderFormCard();

    const card = screen.getByTestId(FORM_CARD_TEST_ID);
    expect(card).toHaveClass("MuiPaper-root");
    expect(card).toHaveTextContent("Form fields");
    expect(
      within(card).getByRole("heading", { level: 2, name: "Edit wardrobe" }),
    ).toBeInTheDocument();
    expect(card).toHaveStyle({
      width: "100%",
      maxWidth: `${FORM_CARD_MAX_WIDTH}px`,
      marginLeft: "auto",
      marginRight: "auto",
    });
  });

  it("renders Cancel at the top right and calls onCancel", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderFormCard();

    const header = screen.getByTestId(FORM_CARD_HEADER_TEST_ID);
    const cancel = screen.getByTestId(FORM_CARD_CANCEL_TEST_ID);
    expect(header).toContainElement(cancel);
    expect(header).toHaveStyle({ justifyContent: "space-between" });
    expect(cancel).toHaveAttribute("aria-label", "Cancel");
    expect(cancel).toHaveAttribute("tabindex", "0");
    expect(
      cancel.compareDocumentPosition(screen.getByText("Form fields")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    await user.click(cancel);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("activates Cancel from the keyboard", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderFormCard();

    const cancel = screen.getByRole("button", { name: "Cancel" });
    cancel.focus();
    expect(cancel).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders a full-width submit button", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderFormCard();

    const submit = screen.getByTestId(FORM_CARD_SUBMIT_TEST_ID);
    expect(submit).toHaveClass("MuiButton-fullWidth");
    expect(submit).toHaveAttribute("aria-label", "Save changes");
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows the submitting label and disables submit while loading", () => {
    const { onSubmit } = renderFormCard({
      submittingLabel: "Saving wardrobe",
      isSubmitting: true,
    });

    const submit = screen.getByRole("button", { name: "Saving wardrobe" });
    expect(submit).toBeDisabled();
    expect(submit).toHaveClass("MuiButton-fullWidth");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables submit when isSubmitDisabled is set", () => {
    const { onSubmit } = renderFormCard({
      isSubmitDisabled: true,
    });

    const submit = screen.getByRole("button", { name: "Save changes" });
    expect(submit).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("is the only form-card component", () => {
    expectOnlySharedFormCardComponent();
  });
});
