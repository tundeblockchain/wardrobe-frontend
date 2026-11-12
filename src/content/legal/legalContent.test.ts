import { describe, expect, it } from "vitest";
import { getLegalContactCopy } from "./legalDocument";
import { getPrivacyPolicyContent } from "./privacyPolicy";
import { getTermsOfServiceContent } from "./termsOfService";

const uniqueIds = (ids: string[]) => new Set(ids).size === ids.length;

describe("legal content", () => {
  it("keeps Terms of Service section ids unique and covers store-review topics", () => {
    const content = getTermsOfServiceContent("Pocket Closet");
    const ids = content.sections.map((section) => section.id);
    const titles = content.sections.map((section) => section.title);

    expect(uniqueIds(ids)).toBe(true);
    expect(content.intro).toContain("Pocket Closet");
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
    const content = getPrivacyPolicyContent("Pocket Closet");
    const ids = content.sections.map((section) => section.id);
    const titles = content.sections.map((section) => section.title);

    expect(uniqueIds(ids)).toBe(true);
    expect(content.intro).toContain("Pocket Closet");
    expect(titles).toEqual(
      expect.arrayContaining([
        "Information collected",
        "Photos, try-on, and automated processing",
        "How information is shared",
        "Mobile advertising and attribution",
        "App Tracking Transparency",
        "SKAdNetwork",
        "Android advertising identifier",
        "Children’s privacy",
        "Your choices and rights",
        "Cookies and similar technologies",
      ]),
    );

    const cookies = content.sections.find(
      (section) => section.id === "cookies",
    );
    const cookiesCopy = cookies?.paragraphs.join(" ") ?? "";
    expect(cookiesCopy).toMatch(/Firebase Authentication/);
    expect(cookiesCopy).toMatch(/Google Analytics 4/);
    expect(cookiesCopy).toMatch(/TikTok pixel/);
    expect(cookiesCopy).toMatch(/Meta Pixel/);
    expect(cookiesCopy).toMatch(/only after you choose to allow them/);
    expect(cookiesCopy).toMatch(/Cookie settings link in the footer/);
    expect(cookies?.action?.label).toBe("Cookie settings");
    expect(cookiesCopy).not.toMatch(/not wired in this MVP/);

    const mobileAdvertising = content.sections.find(
      (section) => section.id === "mobile-advertising",
    );
    const mobileAdvertisingCopy = [
      ...(mobileAdvertising?.paragraphs ?? []),
      ...(mobileAdvertising?.bullets ?? []),
    ].join(" ");
    expect(mobileAdvertisingCopy).toMatch(/TikTok Business SDK/);
    expect(mobileAdvertisingCopy).toMatch(/TikTok pixel/);
    expect(mobileAdvertisingCopy).toMatch(/Meta Pixel/);
    expect(mobileAdvertisingCopy).toMatch(/Meta Platforms/);
    expect(mobileAdvertisingCopy).toMatch(/does not sell personal information/);
    expect(mobileAdvertisingCopy).toMatch(/Names and email addresses are not sent/);
    expect(mobileAdvertisingCopy).toMatch(/creating wardrobes/);
    expect(mobileAdvertising?.links?.map((link) => link.label)).toEqual([
      "TikTok Privacy Policy",
      "Meta Privacy Policy",
    ]);

    const att = content.sections.find(
      (section) => section.id === "app-tracking-transparency",
    );
    expect(att?.paragraphs.join(" ")).toMatch(/App Tracking Transparency/);
    expect(att?.paragraphs.join(" ")).toMatch(
      /No tracking events are sent to TikTok or Meta before you answer/,
    );

    const skan = content.sections.find((section) => section.id === "skadnetwork");
    expect(skan?.paragraphs.join(" ")).toMatch(/SKAdNetwork/);
    expect(skan?.title).toBe("SKAdNetwork");

    const androidAdvertising = content.sections.find(
      (section) => section.id === "android-advertising-id",
    );
    const androidCopy = androidAdvertising?.paragraphs.join(" ") ?? "";
    expect(androidAdvertising?.title).toBe("Android advertising identifier");
    expect(androidCopy).toMatch(/“Personalised ads”/);
    expect(androidCopy).toMatch(/Account > Privacy/);
    expect(androidCopy).toMatch(/off by default/);
    expect(androidCopy).toMatch(/Allow and Don’t allow/);
    expect(androidCopy).toMatch(/does not share the Google advertising ID/);
    expect(androidCopy).toMatch(/does not send subscription events to TikTok/);
    expect(androidCopy).toMatch(
      /App events can still be sent without the advertising ID/,
    );
    expect(androidCopy).toMatch(/Meta stops using the advertising ID immediately/);
    expect(androidCopy).toMatch(/TikTok pauses until the next app launch/);
    expect(androidCopy).not.toMatch(/stop sending all events/i);
    expect(androidCopy).toMatch(
      /managed in iOS Settings, not by an in-app switch/,
    );

    const attCopy = att?.paragraphs.join(" ") ?? "";
    expect(attCopy).toMatch(
      /managed in iOS Settings > Privacy & Security > Tracking, not by an in-app switch/,
    );
  });

  it("describes operator contact without requiring a configured email", () => {
    const copy = getLegalContactCopy({
      appName: "Pocket Closet",
      contactEmail: undefined,
      contactUrl: undefined,
    });

    expect(copy.email).toBeUndefined();
    expect(copy.paragraphs.join(" ")).toMatch(/store listing contact/);
    expect(copy.paragraphs.join(" ")).toMatch(/the operator/);
  });
});
