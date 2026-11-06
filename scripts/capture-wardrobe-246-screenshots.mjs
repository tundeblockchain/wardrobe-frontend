#!/usr/bin/env node
/**
 * Capture WARDROBE-246 dashboard screenshots into docs/screenshots/WARDROBE-246/.
 * Dev helper only. Requires Playwright Chromium.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(repoRoot, "docs/screenshots/WARDROBE-246");

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
};

const shots = [
  { name: "home-{viewport}-before", phase: "before", wardrobes: "populated", wishes: "populated" },
  { name: "home-{viewport}-before-empty", phase: "before", wardrobes: "empty", wishes: "empty" },
  { name: "home-{viewport}-after", phase: "after", wardrobes: "populated", wishes: "populated" },
  { name: "home-{viewport}-after-empty", phase: "after", wardrobes: "populated", wishes: "empty" },
  { name: "home-{viewport}-after-add-dialog", phase: "after", wardrobes: "populated", wishes: "populated", dialog: "add" },
  { name: "home-{viewport}-after-acquire-picker", phase: "after", wardrobes: "populated", wishes: "populated", dialog: "acquire" },
];

const waitForHome = async (page) => {
  await page.getByRole("heading", { level: 1, name: "Your closet" }).waitFor();
};

const openDialog = async (page, dialog) => {
  if (dialog === "add") {
    await page.getByRole("button", { name: "Add to wish list" }).first().click();
    await page.getByRole("heading", { name: "Add to wish list" }).waitFor();
    return;
  }

  if (dialog === "acquire") {
    await page.getByRole("button", { name: "Black loafers" }).click();
    await page.getByRole("button", { name: "Mark this wish as owned" }).click();
    await page.getByRole("heading", { name: "Choose a wardrobe" }).waitFor();
  }
};

const capture = async () => {
  await mkdir(outputDir, { recursive: true });
  const server = await createServer({
    configFile: path.join(repoRoot, "vite.config.ts"),
    server: { port: 4178, strictPort: true, host: "127.0.0.1" },
  });
  await server.listen();
  const baseUrl =
    server.resolvedUrls?.local[0]?.replace(/\/$/, "") ?? "http://127.0.0.1:4178";
  const warmupDeadline = Date.now() + 15_000;
  let warmedUp = false;
  while (Date.now() < warmupDeadline) {
    try {
      const response = await fetch(`${baseUrl}/screenshot.html`);
      if (response.ok) {
        warmedUp = true;
        break;
      }
    } catch {
      // Vite may still be binding.
    }
  }
  if (!warmedUp) {
    throw new Error(`Screenshot server did not start at ${baseUrl}`);
  }

  const browser = await chromium.launch();
  try {
    for (const theme of ["light", "dark"]) {
      for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
        for (const shot of shots) {
          const suffix = theme === "dark" ? "-dark" : "";
          const filename = `${shot.name.replace("{viewport}", viewportName)}${suffix}.png`;
          const search = new URLSearchParams({
            phase: shot.phase,
            wardrobes: shot.wardrobes,
            wishes: shot.wishes,
            theme,
          });
          const url = `${baseUrl}/screenshot.html?${search.toString()}`;
          const page = await browser.newPage({
            viewport,
            colorScheme: theme,
          });
          await page.addInitScript((nextTheme) => {
            globalThis.localStorage.setItem(
              "wardrobe.theme-preference",
              nextTheme,
            );
          }, theme);
          await page.goto(url, { waitUntil: "networkidle" });
          await waitForHome(page);
          if (shot.dialog) {
            await openDialog(page, shot.dialog);
            await page.waitForTimeout(350);
          }
          await page.screenshot({
            path: path.join(outputDir, filename),
            fullPage: true,
          });
          await page.close();
          console.log(filename);
        }
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
};

capture().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
