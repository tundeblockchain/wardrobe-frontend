import { Button, Paper, Stack } from "@mui/material";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { stubMatchMedia } from "../../test/matchMedia";
import {
  expectActionButtonNotFullWidth,
  expectInsideNarrowContent,
  expectOnlySharedNarrowContentComponent,
} from "../../test/dashboardNarrowContentTest";
import { renderWithProviders } from "../../test/renderWithProviders";
import {
  DASHBOARD_NARROW_CONTENT_MAX_WIDTH,
  DASHBOARD_NARROW_CONTENT_TEST_ID,
  DashboardNarrowContent,
} from "./DashboardNarrowContent";
import { DashboardPaper } from "./DashboardPaper";
import { StatusCard } from "../StatusCard";

describe("DashboardNarrowContent", () => {
  it("is the only shared empty-state and lock-card wrapper", () => {
    expectOnlySharedNarrowContentComponent();
  });

  it("constrains and centres content at the shared max width", () => {
    renderWithProviders(
      <DashboardNarrowContent>
        <StatusCard
          title="No outfits yet"
          description="Add an outfit from the clothing items you already own."
        />
        <Button variant="contained">Add outfit</Button>
      </DashboardNarrowContent>,
    );

    const wrapper = screen.getByTestId(DASHBOARD_NARROW_CONTENT_TEST_ID);
    expectNarrowRange(DASHBOARD_NARROW_CONTENT_MAX_WIDTH);
    expectInsideNarrowContent(
      screen.getByRole("heading", { name: "No outfits yet" }),
    );
    expect(wrapper).toHaveStyle({
      width: "100%",
      maxWidth: `${DASHBOARD_NARROW_CONTENT_MAX_WIDTH}px`,
      marginLeft: "auto",
      marginRight: "auto",
      alignSelf: "center",
    });
    expectActionButtonNotFullWidth(
      screen.getByRole("button", { name: "Add outfit" }),
    );
  });

  it("keeps nested status cards stretching while buttons stay content-sized", () => {
    renderWithProviders(
      <DashboardNarrowContent>
        <StatusCard
          title="Virtual Try On is a Premium feature"
          description="Upgrade to browse Virtual Profiles."
        />
        <Stack spacing={2}>
          <Button variant="contained">Manage plan</Button>
        </Stack>
      </DashboardNarrowContent>,
    );

    const card = screen.getByRole("article", {
      name: "Virtual Try On is a Premium feature",
    });
    expect(card).toHaveClass("MuiPaper-root");
    expectInsideNarrowContent(card);
    expectActionButtonNotFullWidth(
      screen.getByRole("button", { name: "Manage plan" }),
    );
  });

  it("fills the parent width on a mobile viewport", () => {
    stubMatchMedia(true);
    renderWithProviders(
      <DashboardPaper>
        <DashboardNarrowContent>
          <Paper elevation={0}>Mobile empty state</Paper>
        </DashboardNarrowContent>
      </DashboardPaper>,
    );

    const wrapper = screen.getByTestId(DASHBOARD_NARROW_CONTENT_TEST_ID);
    expect(wrapper).toHaveStyle({
      width: "100%",
      maxWidth: `${DASHBOARD_NARROW_CONTENT_MAX_WIDTH}px`,
      minWidth: "0px",
    });
    expect(
      within(wrapper).getByText("Mobile empty state"),
    ).toBeInTheDocument();
  });
});

const expectNarrowRange = (maxWidth: number) => {
  expect(maxWidth).toBeGreaterThanOrEqual(480);
  expect(maxWidth).toBeLessThanOrEqual(560);
};
