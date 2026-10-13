import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ComingSoonPage } from "./ComingSoonPage";

describe("ComingSoonPage", () => {
  it("renders the placeholder heading and description", () => {
    renderWithProviders(
      <ComingSoonPage
        headingId="coming-soon-heading"
        title="Coming soon"
        description="This section is coming soon."
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Coming soon" }),
    ).toBeInTheDocument();
    expect(screen.getByText("This section is coming soon.")).toBeInTheDocument();
  });
});
