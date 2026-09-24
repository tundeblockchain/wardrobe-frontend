#!/usr/bin/env node
/**
 * Generate compressed, resized marketing screenshots from raw iOS captures.
 *
 * This is a local/dev helper. CI does not run it and does not need the raw
 * multi-MB PNGs — commit only the derivatives under public/screenshots/.
 *
 * Usage:
 *   npm run screenshots
 *   SCREENSHOT_SOURCE_DIR=/path/to/raw npm run screenshots
 *
 * See docs/screenshots.md.
 */
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultSourceDir = path.join(repoRoot, "screenshots-source");
const outputDir = path.join(repoRoot, "public", "screenshots");
const ogOutputPath = path.join(repoRoot, "public", "og-image.jpg");

const WIDTHS = [390, 780, 1170];
const TARGET_ASPECT = 9 / 19.5;

const SLOT_MATCHERS = [
  { id: "try-on-rust-floral", patterns: ["01-tryon-rust-floral", "try-on-rust-floral"] },
  { id: "try-on-ivory-maxi", patterns: ["02-tryon-ivory-maxi", "try-on-ivory-maxi"] },
  { id: "try-on-blue-mini", patterns: ["03-tryon-blue-mini", "try-on-blue-mini"] },
  { id: "item-detail", patterns: ["04-item-detail-plum", "item-detail"] },
  { id: "home", patterns: ["05-home", "home"] },
  { id: "add-item", patterns: ["06-add-item", "add-item"] },
];

const formatBytes = (bytes) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const sourceFlagIndex = args.findIndex((arg) => arg === "--source" || arg === "-s");
  const sourceFromFlag =
    sourceFlagIndex >= 0 ? args[sourceFlagIndex + 1] : undefined;

  return {
    sourceDir: path.resolve(
      sourceFromFlag ?? process.env.SCREENSHOT_SOURCE_DIR ?? defaultSourceDir,
    ),
  };
};

const listPngFiles = async (directory) => {
  const entries = await readdir(directory);
  return entries
    .filter((entry) => entry.toLowerCase().endsWith(".png"))
    .map((entry) => path.join(directory, entry));
};

const matchSlotId = (filePath) => {
  const basename = path.basename(filePath).toLowerCase();

  return SLOT_MATCHERS.find((matcher) =>
    matcher.patterns.some((pattern) => basename.startsWith(pattern)),
  )?.id;
};

const cropToPortraitFrame = async (image) => {
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (width === 0 || height === 0) {
    throw new Error("Source image is missing dimensions.");
  }

  const currentAspect = width / height;
  if (Math.abs(currentAspect - TARGET_ASPECT) < 0.01) {
    return image;
  }

  if (currentAspect > TARGET_ASPECT) {
    const cropWidth = Math.round(height * TARGET_ASPECT);
    const left = Math.round((width - cropWidth) / 2);
    return image.extract({ left, top: 0, width: cropWidth, height });
  }

  const cropHeight = Math.round(width / TARGET_ASPECT);
  const top = Math.round((height - cropHeight) / 2);
  return image.extract({ left: 0, top, width, height: cropHeight });
};

const writeResizedFormats = async (sourcePath, slotId) => {
  const baseImage = await cropToPortraitFrame(sharp(sourcePath).rotate());
  const pipelineResults = [];

  for (const width of WIDTHS) {
    const resized = baseImage.clone().resize({
      width,
      withoutEnlargement: true,
    });

    const outputs = [
      {
        ext: "avif",
        file: path.join(outputDir, `${slotId}-${width}.avif`),
        save: (img) =>
          img.avif({
            quality: 42,
            effort: 6,
            chromaSubsampling: "4:2:0",
          }),
      },
      {
        ext: "webp",
        file: path.join(outputDir, `${slotId}-${width}.webp`),
        save: (img) =>
          img.webp({
            quality: 68,
            effort: 6,
            smartSubsample: true,
          }),
      },
      {
        ext: "jpg",
        file: path.join(outputDir, `${slotId}-${width}.jpg`),
        save: (img) =>
          img.jpeg({
            quality: 72,
            mozjpeg: true,
            progressive: true,
            chromaSubsampling: "4:2:0",
          }),
      },
    ];

    for (const output of outputs) {
      await output.save(resized.clone()).toFile(output.file);
      const fileStat = await stat(output.file);
      pipelineResults.push({
        slotId,
        width,
        ext: output.ext,
        bytes: fileStat.size,
        file: output.file,
      });
    }
  }

  return pipelineResults;
};

const writeOgImage = async (heroSourcePath) => {
  const metadata = await sharp(heroSourcePath).rotate().metadata();
  const width = metadata.width ?? 1170;
  const height = metadata.height ?? 2532;
  const lookTop = Math.round(height * 0.38);
  const lookHeight = Math.max(1, height - lookTop);

  await sharp(heroSourcePath)
    .rotate()
    .extract({
      left: 0,
      top: lookTop,
      width,
      height: lookHeight,
    })
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .jpeg({
      quality: 78,
      mozjpeg: true,
      progressive: true,
    })
    .toFile(ogOutputPath);

  const fileStat = await stat(ogOutputPath);
  return { file: ogOutputPath, bytes: fileStat.size };
};

const main = async () => {
  const { sourceDir } = parseArgs();

  let sourceFiles;
  try {
    sourceFiles = await listPngFiles(sourceDir);
  } catch {
    console.error(
      `No source directory at ${sourceDir}.\n` +
        "Pass --source /path/to/raw-pngs or set SCREENSHOT_SOURCE_DIR.\n" +
        "See docs/screenshots.md.",
    );
    process.exitCode = 1;
    return;
  }

  const matched = new Map();
  for (const filePath of sourceFiles) {
    const slotId = matchSlotId(filePath);
    if (!slotId || matched.has(slotId)) {
      continue;
    }
    matched.set(slotId, filePath);
  }

  const missing = SLOT_MATCHERS.map((matcher) => matcher.id).filter(
    (slotId) => !matched.has(slotId),
  );
  if (missing.length > 0) {
    console.error(
      `Missing source PNGs for: ${missing.join(", ")}\nLooked in ${sourceDir}`,
    );
    process.exitCode = 1;
    return;
  }

  await mkdir(outputDir, { recursive: true });

  const sourceStats = [];
  const outputs = [];

  for (const [slotId, filePath] of matched) {
    const fileStat = await stat(filePath);
    sourceStats.push({ slotId, file: filePath, bytes: fileStat.size });
    outputs.push(...(await writeResizedFormats(filePath, slotId)));
  }

  const heroSource = matched.get("try-on-rust-floral");
  if (!heroSource) {
    console.error("Hero source try-on-rust-floral is required for og-image.jpg.");
    process.exitCode = 1;
    return;
  }

  const ogImage = await writeOgImage(heroSource);
  const sourceTotal = sourceStats.reduce((sum, item) => sum + item.bytes, 0);
  const outputTotal =
    outputs.reduce((sum, item) => sum + item.bytes, 0) + ogImage.bytes;
  const heroJpgs = outputs.filter(
    (item) => item.slotId === "try-on-rust-floral" && item.ext === "jpg",
  );

  const report = {
    sourceDir,
    sourceTotalBytes: sourceTotal,
    outputTotalBytes: outputTotal,
    files: outputs.map((item) => ({
      file: path.relative(repoRoot, item.file),
      bytes: item.bytes,
    })),
    ogImage: {
      file: path.relative(repoRoot, ogImage.file),
      bytes: ogImage.bytes,
    },
  };

  await writeFile(
    path.join(outputDir, "generation-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  console.log("Screenshot derivatives written to public/screenshots/");
  console.log(`OG image: ${path.relative(repoRoot, ogImage.file)} (${formatBytes(ogImage.bytes)})`);
  console.log(`Source total: ${formatBytes(sourceTotal)}`);
  console.log(`Derivative total (incl. OG): ${formatBytes(outputTotal)}`);
  for (const item of heroJpgs) {
    console.log(`  hero jpg ${item.width}w: ${formatBytes(item.bytes)}`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
