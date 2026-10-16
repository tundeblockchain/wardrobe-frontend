import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vitest/config";

const require = createRequire(import.meta.url);
const INTER_LATIN_FILE = "inter-latin-wght-normal";

const preloadInterFontPlugin = (): Plugin => {
  const interLatinPath = require.resolve(
    "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  );

  return {
    name: "preload-inter-font",
    transformIndexHtml(_html, context) {
      if (!context.server) {
        return [];
      }

      return [
        {
          tag: "link",
          injectTo: "head",
          attrs: {
            rel: "preload",
            as: "font",
            type: "font/woff2",
            crossorigin: "",
            href: `/@fs${interLatinPath}`,
          },
        },
      ];
    },
    closeBundle() {
      const distDir = join(process.cwd(), "dist");
      const htmlPath = join(distDir, "index.html");
      const assetsDir = join(distDir, "assets");
      if (!existsSync(htmlPath) || !existsSync(assetsDir)) {
        return;
      }

      const html = readFileSync(htmlPath, "utf8");

      if (html.includes('as="font"') && html.includes(INTER_LATIN_FILE)) {
        return;
      }

      const fontFile = readdirSync(assetsDir).find(
        (fileName) =>
          fileName.includes(INTER_LATIN_FILE) && fileName.endsWith(".woff2"),
      );

      if (!fontFile) {
        throw new Error("Could not find the Inter latin font to preload.");
      }

      const preloadTag = `<link rel="preload" as="font" type="font/woff2" href="/assets/${fontFile}" crossorigin>`;
      writeFileSync(
        htmlPath,
        html.replace("<head>", `<head>\n    ${preloadTag}`),
      );
    },
  };
};

export default defineConfig({
  plugins: [react(), preloadInterFontPlugin()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
