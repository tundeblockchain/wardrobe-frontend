import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ResourceImage } from "./ResourceImage";

describe("ResourceImage", () => {
  it("renders the image src and shows the placeholder after onError", () => {
    const handleImageError = vi.fn();
    const { rerender } = renderWithProviders(
      <ResourceImage
        imageUrl="https://cdn.example.com/expired.jpg"
        alt="My wardrobe"
        fallbackLabel="No photo for this wardrobe"
        onImageError={handleImageError}
      />,
    );

    const image = screen.getByRole("img", { name: "My wardrobe" });
    expect(image).toHaveAttribute("src", "https://cdn.example.com/expired.jpg");

    fireEvent.error(image);

    expect(handleImageError).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("img", { name: "My wardrobe" })).not.toBeInTheDocument();
    expect(screen.getByText("No photo for this wardrobe")).toBeInTheDocument();

    rerender(
      <ResourceImage
        imageUrl="https://cdn.example.com/fresh.jpg"
        alt="My wardrobe"
        fallbackLabel="No photo for this wardrobe"
        onImageError={handleImageError}
      />,
    );

    expect(screen.getByRole("img", { name: "My wardrobe" })).toHaveAttribute(
      "src",
      "https://cdn.example.com/fresh.jpg",
    );
  });

  it("renders the placeholder when no image url is provided", () => {
    renderWithProviders(
      <ResourceImage
        alt="My wardrobe"
        fallbackLabel="No photo for this wardrobe"
      />,
    );

    expect(screen.queryByRole("img", { name: "My wardrobe" })).not.toBeInTheDocument();
    expect(screen.getByText("No photo for this wardrobe")).toBeInTheDocument();
  });
});
