import { screen, within } from "@testing-library/react";
import { expect } from "vitest";
import {
  FORM_CARD_CANCEL_TEST_ID,
  FORM_CARD_SUBMIT_TEST_ID,
  FORM_CARD_TEST_ID,
} from "../components/dashboard/FormCard";

const FORM_CARD_FILE_NAME = /form[-_]?card/i;
const FORM_CARD_EXPORT_NAME =
  /export const ((?:[A-Z][A-Za-z]*)?(?:FormCard|FormShell|FormPanel)(?:[A-Z][A-Za-z]*)?)/g;

const dashboardSources = import.meta.glob(
  ["../components/**/*.{ts,tsx}", "../pages/**/*.{ts,tsx}"],
  { eager: true, query: "?raw", import: "default" },
);

const isTestFile = (filePath: string) => {
  return filePath.includes(".test.");
};

export const expectFormInsideSharedCard = async (formName: string) => {
  const form = await screen.findByRole("form", { name: formName });
  const card = screen.getByTestId(FORM_CARD_TEST_ID);
  expect(card).toContainElement(form);

  const cancel = within(card).getByTestId(FORM_CARD_CANCEL_TEST_ID);
  expect(cancel).toHaveAttribute("aria-label", "Cancel");
  expect(form).toContainElement(cancel);

  const submit = within(form).getByTestId(FORM_CARD_SUBMIT_TEST_ID);
  expect(submit).toHaveAccessibleName(formName);
  expect(submit).toHaveClass("MuiButton-fullWidth");
};

export const expectSharedFormCardAbsent = () => {
  expect(screen.queryByTestId(FORM_CARD_TEST_ID)).not.toBeInTheDocument();
};

export const expectOnlySharedFormCardComponent = () => {
  const sourceEntries = Object.entries(dashboardSources).filter(
    ([filePath]) => !isTestFile(filePath),
  );
  const formCardFiles = sourceEntries
    .map(([filePath]) => filePath)
    .filter((filePath) => {
      const fileName = filePath.split("/").pop() ?? "";
      return FORM_CARD_FILE_NAME.test(fileName);
    });
  expect(formCardFiles).toEqual(["../components/dashboard/FormCard.tsx"]);

  const exportedFormCards = sourceEntries.flatMap(([filePath, source]) => {
    if (typeof source !== "string") {
      return [];
    }

    return [...source.matchAll(FORM_CARD_EXPORT_NAME)].map(
      (match) => `${filePath}:${match[1]}`,
    );
  });
  expect(exportedFormCards).toEqual([
    "../components/dashboard/FormCard.tsx:FormCard",
  ]);
};
