import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalDocument } from "./LegalDocument";
import { getTermsOfServiceContent } from "../../content/legal/termsOfService";
import { renderWithProviders } from "../../test/renderWithProviders";
import { appPaths } from "../../routes/paths";

describe("LegalDocument", () => {
  it("renders the document title, table of contents, and store-listing contact fallback", () => {
    renderWithProviders(
      <LegalDocument
        appName="Digital Wardrobe"
        content={getTermsOfServiceContent("Digital Wardrobe")}
        contactEmail={undefined}
        contactUrl={undefined}
        relatedLink={{
          to: appPaths.privacy,
          label: "Privacy Policy",
          ariaLabel: "Privacy Policy",
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Terms of Service" }),
    ).toBeInTheDocument();
    expect(
      screen
        .getByRole("heading", { level: 1, name: "Terms of Service" })
        .closest("[data-surface]"),
    ).toHaveAttribute("data-surface", "mist");
    expect(
      screen.getByRole("link", { name: "Jump to Acceptable use" }),
    ).toHaveAttribute("href", "#acceptable-use");
    expect(
      screen.getByText(
        /A public contact email is not published for this deployment yet/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Email the operator/ }),
    ).not.toBeInTheDocument();
  });

  it("renders the operator contact email and contact page when configured", () => {
    renderWithProviders(
      <LegalDocument
        appName="Digital Wardrobe"
        content={getTermsOfServiceContent("Digital Wardrobe")}
        contactEmail="legal@example.com"
        contactUrl="https://example.com/contact"
        relatedLink={{
          to: appPaths.privacy,
          label: "Privacy Policy",
          ariaLabel: "Privacy Policy",
        }}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Email the operator at legal@example.com" }),
    ).toHaveAttribute("href", "mailto:legal@example.com");
    expect(
      screen.getByRole("link", { name: "Operator contact page" }),
    ).toHaveAttribute("href", "https://example.com/contact");
  });
});
