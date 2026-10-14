import { screen } from "@testing-library/react";
import { expect } from "vitest";
import { FORM_CARD_TEST_ID } from "../components/dashboard/FormCard";

export const expectFormInsideSharedCard = async (formName: string) => {
  const form = await screen.findByRole("form", { name: formName });
  const card = screen.getByTestId(FORM_CARD_TEST_ID);
  expect(card).toContainElement(form);
};

export const expectSharedFormCardAbsent = () => {
  expect(screen.queryByTestId(FORM_CARD_TEST_ID)).not.toBeInTheDocument();
};
