import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { SharePreviewCard } from "./SharePreviewCard";

describe("SharePreviewCard", () => {
  it("renders title, type, and image when present", () => {
    renderWithProviders(
      <SharePreviewCard
        preview={{
          resourceType: "ITEM",
          title: "Black T-Shirt",
          imageUrl: "https://cdn.example.com/item.jpg",
          expiresAt: "2026-10-19T12:00:00.000Z",
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Black T-Shirt" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Shared type: Item")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Black T-Shirt" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/item.jpg",
    );
  });

  it("renders an empty image state when the preview has no photo", () => {
    renderWithProviders(
      <SharePreviewCard
        preview={{
          resourceType: "OUTFIT",
          title: "Weekend brunch",
          expiresAt: "2026-10-19T12:00:00.000Z",
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Weekend brunch" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Shared type: Outfit")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Weekend brunch photo not available"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
