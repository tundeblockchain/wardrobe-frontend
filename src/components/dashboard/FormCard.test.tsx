import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import {
  FORM_CARD_MAX_WIDTH,
  FORM_CARD_TEST_ID,
  FormCard,
} from "./FormCard";

describe("FormCard", () => {
  it("renders children in a centred paper card", () => {
    renderWithProviders(
      <FormCard>
        <p>Form fields</p>
      </FormCard>,
    );

    const card = screen.getByTestId(FORM_CARD_TEST_ID);
    expect(card).toHaveClass("MuiPaper-root");
    expect(card).toHaveTextContent("Form fields");
    expect(card).toHaveStyle({
      width: "100%",
      maxWidth: `${FORM_CARD_MAX_WIDTH}px`,
      marginLeft: "auto",
      marginRight: "auto",
    });
  });
});
