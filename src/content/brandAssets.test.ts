import { statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import indexHtml from "../../index.html?raw";
import webManifestSource from "../../public/site.webmanifest?raw";
import {
  APPLE_TOUCH_ICON_PATH,
  BANNER_ASPECT_RATIO,
  BANNER_HEIGHT,
  BANNER_PATH,
  BANNER_WIDTH,
  FAVICON_192_PATH,
  FAVICON_32_PATH,
  FAVICON_512_PATH,
  FAVICON_ICO_PATH,
  OG_IMAGE_PATH,
  WEB_MANIFEST_PATH,
} from "./brandAssets";

const BANNER_FILE_PATH = join(process.cwd(), "public", BANNER_PATH.replace(/^\//, ""));
const MAX_BANNER_BYTES = 200_000;

describe("brand assets", () => {
  it("wires favicon, apple touch, manifest, and OG tags in index.html", () => {
    expect(indexHtml).toContain(`href="${FAVICON_ICO_PATH}"`);
    expect(indexHtml).toContain(`href="${FAVICON_32_PATH}"`);
    expect(indexHtml).toContain(`href="${FAVICON_192_PATH}"`);
    expect(indexHtml).toContain(`href="${APPLE_TOUCH_ICON_PATH}"`);
    expect(indexHtml).toContain(`href="${WEB_MANIFEST_PATH}"`);
    expect(indexHtml).toContain(`content="${OG_IMAGE_PATH}"`);
    expect(indexHtml).not.toContain('href="/icon.png"');
    expect(indexHtml).not.toContain("favicon.svg");
  });

  it("keeps the landing banner at its intrinsic uncropped size", async () => {
    expect(BANNER_PATH).toBe("/banner.webp");
    expect(BANNER_WIDTH).toBe(1600);
    expect(BANNER_HEIGHT).toBe(686);
    expect(BANNER_ASPECT_RATIO).toBe("1600 / 686");

    const bannerBytes = statSync(BANNER_FILE_PATH).size;
    expect(bannerBytes).toBeGreaterThan(0);
    expect(bannerBytes).toBeLessThan(MAX_BANNER_BYTES);

    const metadata = await sharp(BANNER_FILE_PATH).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(BANNER_WIDTH);
    expect(metadata.height).toBe(BANNER_HEIGHT);
  });

  it("lists wordless 192 and 512 icons in the web manifest", () => {
    const manifest = JSON.parse(webManifestSource) as {
      icons: Array<{ src: string; sizes: string; type: string }>;
    };

    expect(manifest.icons).toEqual([
      {
        src: FAVICON_192_PATH,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: FAVICON_512_PATH,
        sizes: "512x512",
        type: "image/png",
      },
    ]);
  });
});
