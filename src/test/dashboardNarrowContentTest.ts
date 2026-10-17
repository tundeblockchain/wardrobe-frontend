import { screen } from "@testing-library/react";
import { expect } from "vitest";
import {
  DASHBOARD_NARROW_CONTENT_MAX_WIDTH,
  DASHBOARD_NARROW_CONTENT_TEST_ID,
} from "../components/dashboard/DashboardNarrowContent";

const NARROW_CONTENT_FILE_NAME = /dashboard[-_]?narrow[-_]?content/i;
const NARROW_CONTENT_EXPORT_NAME =
  /export const ((?:[A-Z][A-Za-z]*)?(?:NarrowContent|ConstrainedContent|EmptyStateWrapper)(?:[A-Z][A-Za-z]*)?)/g;

const dashboardSources = import.meta.glob(
  ["../components/**/*.{ts,tsx}", "../pages/**/*.{ts,tsx}"],
  { eager: true, query: "?raw", import: "default" },
);

const isTestFile = (filePath: string) => {
  return filePath.includes(".test.");
};

export const getNarrowContentContaining = (element: HTMLElement) => {
  const wrappers = screen.getAllByTestId(DASHBOARD_NARROW_CONTENT_TEST_ID);
  const wrapper = wrappers.find((node) => node.contains(element));
  expect(wrapper).toBeTruthy();
  return wrapper as HTMLElement;
};

export const expectNarrowContentConstraints = (wrapper: HTMLElement) => {
  const computed = window.getComputedStyle(wrapper);
  expect(computed.width).toBe("100%");
  expect(computed.maxWidth).toBe(`${DASHBOARD_NARROW_CONTENT_MAX_WIDTH}px`);
  expect(computed.alignSelf).toBe("center");
};

export const expectInsideNarrowContent = (element: HTMLElement) => {
  const wrapper = getNarrowContentContaining(element);
  expectNarrowContentConstraints(wrapper);
  return wrapper;
};

export const expectActionButtonNotFullWidth = (button: HTMLElement) => {
  expect(button).not.toHaveClass("MuiButton-fullWidth");
  expectInsideNarrowContent(button);
};

export const expectOnlySharedNarrowContentComponent = () => {
  const sourceEntries = Object.entries(dashboardSources).filter(
    ([filePath]) => !isTestFile(filePath),
  );
  const narrowContentFiles = sourceEntries
    .map(([filePath]) => filePath)
    .filter((filePath) => {
      const fileName = filePath.split("/").pop() ?? "";
      return NARROW_CONTENT_FILE_NAME.test(fileName);
    });
  expect(narrowContentFiles).toEqual([
    "../components/dashboard/DashboardNarrowContent.tsx",
  ]);

  const exportedWrappers = sourceEntries.flatMap(([filePath, source]) => {
    if (typeof source !== "string") {
      return [];
    }

    return [...source.matchAll(NARROW_CONTENT_EXPORT_NAME)].map(
      (match) => `${filePath}:${match[1]}`,
    );
  });
  expect(exportedWrappers).toEqual([
    "../components/dashboard/DashboardNarrowContent.tsx:DashboardNarrowContent",
  ]);
};
