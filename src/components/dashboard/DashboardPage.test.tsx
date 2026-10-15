import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { DashboardPage } from "./DashboardPage";

describe("DashboardPage", () => {
  it("fills the paper wrapper without adding its own card padding", () => {
    renderWithProviders(
      <DashboardPage
        headingId="wardrobes-heading"
        title="Wardrobes"
        description="Photograph and organize garments."
      >
        <p>Cards</p>
      </DashboardPage>,
    );

    const container = screen.getByTestId("dashboard-page-container");
    expect(container).not.toHaveClass("MuiContainer-maxWidthLg");
    expect(container).toHaveStyle({
      maxWidth: "none",
      width: "100%",
      minWidth: "0px",
      marginLeft: "0px",
      marginRight: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
    });
    expect(
      screen.getByRole("heading", { level: 1, name: "Wardrobes" }),
    ).toBeInTheDocument();
  });
});
