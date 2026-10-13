import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../test/renderWithProviders";
import { PublicAuthListener } from "./PublicAuthListener";

describe("PublicAuthListener", () => {
  it("renders nothing while waiting for a lazy auth session", () => {
    const { container } = renderWithProviders(<PublicAuthListener />);
    expect(container).toBeEmptyDOMElement();
  });
});
