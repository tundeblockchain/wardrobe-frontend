import { describe, expect, it } from "vitest";
import indexHtml from "../../index.html?raw";
import mainSource from "../main.tsx?raw";

describe("self-hosted fonts", () => {
  it("keeps font loading on the local entry and out of Google runtime links", () => {
    expect(mainSource).toContain('import "./theme/fonts"');
    expect(mainSource).not.toContain("@fontsource/inter/");
    expect(mainSource).not.toContain("fonts.google");
    expect(indexHtml).not.toContain("fonts.google");
    expect(indexHtml).not.toContain("fonts.gstatic");
    expect(indexHtml).not.toMatch(/<link[^>]+font/i);
  });
});
