import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

describe("Inter font", () => {
  it("ships with font-display swap", () => {
    const cssPath = require.resolve("@fontsource/inter/400.css");
    expect(readFileSync(cssPath, "utf8")).toMatch(/font-display:\s*swap/);
  });
});
