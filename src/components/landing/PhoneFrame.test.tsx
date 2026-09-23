import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { PhoneFrame } from "./PhoneFrame";

describe("PhoneFrame", () => {
  it("renders the screenshot with accessible alt text", () => {
    renderWithProviders(
      <PhoneFrame src="/screenshots/home.svg" alt="Placeholder for the Home screen" />,
    );

    expect(
      screen.getByRole("img", { name: "Placeholder for the Home screen" }),
    ).toHaveAttribute("src", "/screenshots/home.svg");
  });

  it("renders compact frames as decorative when alt is empty", () => {
    renderWithProviders(
      <PhoneFrame src="/screenshots/outfits.svg" alt="" compact maxWidth={88} />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(document.querySelector('img[src="/screenshots/outfits.svg"]')).toHaveAttribute(
      "alt",
      "",
    );
  });
});
