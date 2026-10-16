import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const distDir = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const indexHtmlPath = join(distDir, "index.html");
const indexHtml = readFileSync(indexHtmlPath, "utf8");
const scriptMatch = indexHtml.match(
  /<script type="module" crossorigin src="([^"]+)"/,
);

if (!scriptMatch?.[1]) {
  throw new Error("Could not find the landing entry script in dist/index.html");
}

const entryPath = join(distDir, scriptMatch[1].replace(/^\//, ""));
const visited = new Set();
const staticFromPattern = /(?:from|import)\s*["'](\.\/[^"']+)["']/g;
const firebaseFingerprints = [
  "from\"firebase/",
  "from'firebase/",
  "firebase/app",
  "firebase/auth",
  "initializeApp",
  "getAuth",
];

const collectStaticModules = (filePath) => {
  if (visited.has(filePath)) {
    return;
  }

  visited.add(filePath);
  const source = readFileSync(filePath, "utf8");
  for (const match of source.matchAll(staticFromPattern)) {
    const importedPath = match[1];
    if (!importedPath) {
      continue;
    }

    collectStaticModules(join(dirname(filePath), importedPath));
  }
};

collectStaticModules(entryPath);

const leakedFiles = [...visited].filter((filePath) => {
  const source = readFileSync(filePath, "utf8");
  return firebaseFingerprints.some((fingerprint) => source.includes(fingerprint));
});

if (leakedFiles.length > 0) {
  const relativeFiles = leakedFiles.map((filePath) => filePath.replace(`${distDir}/`, ""));
  throw new Error(
    `Firebase must stay out of the landing entry chunk. Found Firebase markers in: ${relativeFiles.join(", ")}`,
  );
}

if (indexHtml.includes("fonts.google") || indexHtml.includes("fonts.gstatic")) {
  throw new Error("Landing HTML must not load fonts from Google at runtime.");
}

const hasInterPreload =
  indexHtml.includes('rel="preload"') &&
  indexHtml.includes('as="font"') &&
  indexHtml.includes("inter-latin-wght-normal") &&
  indexHtml.includes(".woff2");

if (!hasInterPreload) {
  throw new Error("Landing HTML must preload the self-hosted Inter latin font.");
}

const assetDir = join(distDir, "assets");
const assetFiles = readdirSync(assetDir);
const fontFiles = assetFiles.filter((fileName) => fileName.endsWith(".woff2"));
const unexpectedFonts = fontFiles.filter(
  (fileName) =>
    !fileName.includes("inter-latin-wght-normal") &&
    !fileName.includes("sora-latin-wght-normal"),
);

if (!fontFiles.some((fileName) => fileName.includes("inter-latin-wght-normal"))) {
  throw new Error("Build must emit the latin Inter variable font.");
}

if (!fontFiles.some((fileName) => fileName.includes("sora-latin-wght-normal"))) {
  throw new Error("Build must emit the latin Sora variable font.");
}

if (unexpectedFonts.length > 0) {
  throw new Error(
    `Build must ship only latin Inter and Sora fonts. Extra font files: ${unexpectedFonts.join(", ")}`,
  );
}

const cssFiles = assetFiles.filter((fileName) => fileName.endsWith(".css"));
const cssSource = cssFiles
  .map((fileName) => readFileSync(join(assetDir, fileName), "utf8"))
  .join("\n");

if (!cssSource.includes("font-display:swap") && !cssSource.includes("font-display: swap")) {
  throw new Error("Bundled CSS must set font-display: swap on self-hosted faces.");
}

console.log(
  `Landing entry chunk is free of Firebase (${visited.size} static modules from ${scriptMatch[1]}).`,
);
