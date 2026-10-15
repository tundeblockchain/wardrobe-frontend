import { CssBaseline, ThemeProvider } from "@mui/material";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectOnlySharedFormCardComponent } from "../../test/formCardTest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { createDashboardTheme } from "../../theme/createDashboardTheme";
import { wardrobeDarkPalette } from "../../theme/wardrobeDarkPalette";
import { DashboardPaper } from "./DashboardPaper";
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
      fullWidth={props.fullWidth}
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

  it("uses WARDROBE-199 dashboard theme tokens in dark mode", () => {
    const theme = createDashboardTheme("dark");
    const onCancel = vi.fn();
    const onSubmit = vi.fn();

    render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FormCard
          title="Edit wardrobe"
          onCancel={onCancel}
          submitLabel="Save changes"
          onSubmit={onSubmit}
        >
          <p>Form fields</p>
        </FormCard>
      </ThemeProvider>,
    );

    const card = screen.getByTestId(FORM_CARD_TEST_ID);
    const title = screen.getByRole("heading", {
      level: 2,
      name: "Edit wardrobe",
    });
    const submit = screen.getByRole("button", { name: "Save changes" });

    expect(theme.palette.background.paper).toBe(
      wardrobeDarkPalette.backgroundPaper,
    );
    expect(theme.palette.divider).toBe(wardrobeDarkPalette.divider);
    expect(theme.palette.text.primary).toBe(wardrobeDarkPalette.textPrimary);
    expect(card).toHaveStyle({
      backgroundColor: "rgb(28, 21, 24)",
      borderColor: "rgb(58, 42, 48)",
      color: "rgb(246, 237, 240)",
    });
    expect(title).toHaveStyle({ color: "rgb(246, 237, 240)" });
    expect(submit).toHaveStyle({
      backgroundColor: "rgb(232, 168, 186)",
      color: "rgb(42, 18, 28)",
    });
  });

  it("is the only form-card component", () => {
    expectOnlySharedFormCardComponent();
  });

  it("stretches to the container width when fullWidth is set", () => {
    renderFormCard({ fullWidth: true });

    expect(screen.getByTestId(FORM_CARD_TEST_ID)).toHaveStyle({
      width: "100%",
      maxWidth: "none",
      alignSelf: "stretch",
    });
  });

  it("drops nested paper chrome inside the dashboard shell wrapper", () => {
    renderWithProviders(
      <DashboardPaper>
        <FormCard
          title="Edit wardrobe"
          onCancel={vi.fn()}
          submitLabel="Save changes"
          onSubmit={vi.fn()}
        >
          <p>Form fields</p>
        </FormCard>
      </DashboardPaper>,
    );

    const card = screen.getByTestId(FORM_CARD_TEST_ID);
    expect(card).toHaveClass("MuiPaper-root");
    expect(card).toHaveStyle({
      maxWidth: "none",
      paddingLeft: "0px",
      paddingRight: "0px",
      paddingTop: "0px",
      paddingBottom: "0px",
      borderWidth: "0px",
      backgroundColor: "rgba(0, 0, 0, 0)",
      boxShadow: "none",
      overflow: "visible",
      minWidth: "0px",
    });
  });
});
