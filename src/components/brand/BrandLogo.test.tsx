import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LOGO_PATH } from "../../content/brandAssets";
import { renderWithProviders } from "../../test/renderWithProviders";
import { BrandLogo } from "./BrandLogo";

describe("BrandLogo", () => {
  it("renders the worded app logo", () => {
    renderWithProviders(<BrandLogo alt="Pocket Closet logo" />);

    const logo = screen.getByRole("img", { name: "Pocket Closet logo" });
    expect(logo).toHaveAttribute("src", LOGO_PATH);
    expect(logo).toHaveStyle({ alignSelf: "flex-start" });
  });
});
