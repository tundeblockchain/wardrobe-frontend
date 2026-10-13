import { readFileSync } from "node:fs";
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

console.log(
  `Landing entry chunk is free of Firebase (${visited.size} static modules from ${scriptMatch[1]}).`,
);
