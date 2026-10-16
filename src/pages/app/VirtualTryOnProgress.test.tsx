import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { VirtualTryOnProgress } from "./VirtualTryOnProgress";

describe("VirtualTryOnProgress", () => {
  it("shows a progress indicator with the creating label", () => {
    renderWithProviders(
      <VirtualTryOnProgress label="Creating your try-on…" />,
    );

    expect(
      screen.getByRole("status", { name: "Creating your try-on…" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Creating your try-on…")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { hidden: true })).toBeInTheDocument();
  });
});
