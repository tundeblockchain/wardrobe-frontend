import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import indexHtml from "../../index.html?raw";
import webManifestSource from "../../public/site.webmanifest?raw";
import {
  APPLE_TOUCH_ICON_PATH,
  FAVICON_192_PATH,
  FAVICON_32_PATH,
  FAVICON_512_PATH,
  FAVICON_ICO_PATH,
  HERO_IMAGE_ASPECT_RATIO,
  HERO_IMAGE_HEIGHT,
  HERO_IMAGE_PATH,
  HERO_IMAGE_WIDTH,
  OG_IMAGE_PATH,
  WEB_MANIFEST_PATH,
} from "./brandAssets";

const HERO_IMAGE_FILE_PATH = join(
  process.cwd(),
  "public",
  HERO_IMAGE_PATH.replace(/^\//, ""),
);
const OG_IMAGE_FILE_PATH = join(process.cwd(), "public", OG_IMAGE_PATH.replace(/^\//, ""));
const RETIRED_BANNER_FILE_PATH = join(process.cwd(), "public", "banner.webp");
const MAX_HERO_IMAGE_BYTES = 200_000;

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

  it("keeps the landing hero phones on a transparent uncropped WebP", async () => {
    expect(HERO_IMAGE_PATH).toBe("/hero-phones.webp");
    expect(HERO_IMAGE_WIDTH).toBe(1400);
    expect(HERO_IMAGE_HEIGHT).toBe(933);
    expect(HERO_IMAGE_ASPECT_RATIO).toBe("1400 / 933");
    expect(existsSync(RETIRED_BANNER_FILE_PATH)).toBe(false);

    const heroBytes = statSync(HERO_IMAGE_FILE_PATH).size;
    expect(heroBytes).toBeGreaterThan(0);
    expect(heroBytes).toBeLessThan(MAX_HERO_IMAGE_BYTES);

    const metadata = await sharp(HERO_IMAGE_FILE_PATH).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.hasAlpha).toBe(true);
    expect(metadata.width).toBe(HERO_IMAGE_WIDTH);
    expect(metadata.height).toBe(HERO_IMAGE_HEIGHT);
  });

  it("keeps the social share image on the dedicated OG crop", () => {
    expect(OG_IMAGE_PATH).toBe("/og-image.jpg");
    expect(existsSync(OG_IMAGE_FILE_PATH)).toBe(true);
    expect(statSync(OG_IMAGE_FILE_PATH).size).toBeGreaterThan(0);
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
