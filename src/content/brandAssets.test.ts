import { describe, expect, it } from "vitest";
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

  it("keeps the landing banner at its intrinsic 16:9 size", () => {
    expect(BANNER_PATH).toBe("/banner.jpg");
    expect(BANNER_WIDTH).toBe(1600);
    expect(BANNER_HEIGHT).toBe(900);
    expect(BANNER_ASPECT_RATIO).toBe("1600 / 900");
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
