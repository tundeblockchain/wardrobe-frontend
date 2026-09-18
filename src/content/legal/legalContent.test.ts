import { describe, expect, it } from "vitest";
import { getLegalContactCopy } from "./legalDocument";
import { getPrivacyPolicyContent } from "./privacyPolicy";
import { getTermsOfServiceContent } from "./termsOfService";

const uniqueIds = (ids: string[]) => new Set(ids).size === ids.length;

describe("legal content", () => {
  it("keeps Terms of Service section ids unique and covers store-review topics", () => {
    const content = getTermsOfServiceContent("Digital Wardrobe");
    const ids = content.sections.map((section) => section.id);
    const titles = content.sections.map((section) => section.title);

    expect(uniqueIds(ids)).toBe(true);
    expect(titles).toEqual(
      expect.arrayContaining([
        "Agreement",
        "The service",
        "Accounts",
        "User content",
        "Acceptable use",
        "Mobile apps and stores",
        "Disclaimers",
        "Limitation of liability",
      ]),
    );
  });

  it("keeps Privacy Policy section ids unique and covers store-review topics", () => {
    const content = getPrivacyPolicyContent("Digital Wardrobe");
    const ids = content.sections.map((section) => section.id);
    const titles = content.sections.map((section) => section.title);

    expect(uniqueIds(ids)).toBe(true);
    expect(titles).toEqual(
      expect.arrayContaining([
        "Information collected",
        "Photos, try-on, and automated processing",
        "How information is shared",
        "Children’s privacy",
        "Your choices and rights",
      ]),
    );
  });

  it("describes operator contact without requiring a configured email", () => {
    const copy = getLegalContactCopy({
      appName: "Digital Wardrobe",
      contactEmail: undefined,
      contactUrl: undefined,
    });

    expect(copy.email).toBeUndefined();
    expect(copy.paragraphs.join(" ")).toMatch(/store listing contact/);
    expect(copy.paragraphs.join(" ")).toMatch(/the operator/);
  });
});
