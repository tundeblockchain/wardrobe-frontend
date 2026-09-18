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

  it("renders nothing when the title is empty", () => {
    const { container } = renderWithProviders(
      <StatusCard title="" description="Hidden" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
