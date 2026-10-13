import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { DashboardPage } from "./DashboardPage";

describe("DashboardPage", () => {
  it("fills the main column instead of centering a max-width container", () => {
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
      marginLeft: "0px",
      marginRight: "0px",
    });
    expect(container).toHaveStyle({ paddingLeft: "24px", paddingRight: "24px" });
  });
});
