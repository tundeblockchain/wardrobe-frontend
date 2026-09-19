import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusCard } from "./StatusCard";
import { renderWithProviders } from "../test/renderWithProviders";

describe("StatusCard", () => {
  it("renders the title and description", () => {
    renderWithProviders(
      <StatusCard title="Scaffold status" description="Ready for review." />,
    );

    expect(
      screen.getByRole("heading", { name: "Scaffold status" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ready for review.")).toBeInTheDocument();
  });

  it("can render the title as the page heading", () => {
    renderWithProviders(
      <StatusCard
        headingComponent="h1"
        title="This share isn't available"
        description="The link may be incorrect."
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "This share isn't available",
      }),
    ).toBeInTheDocument();
  });

  it("renders nothing when the title is empty", () => {
    const { container } = renderWithProviders(
      <StatusCard title="" description="Hidden" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
