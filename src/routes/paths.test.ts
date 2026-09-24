import { describe, expect, it } from "vitest";
import {
  appPaths,
  getSharePath,
  isSharePreviewPath,
  parseShareTokenFromPath,
} from "./paths";

describe("share paths", () => {
  it("builds and parses /share/:token", () => {
    expect(appPaths.share).toBe("/share/:token");
    expect(getSharePath("shr_abcdefghijklmnopqrstu")).toBe(
      "/share/shr_abcdefghijklmnopqrstu",
    );
    expect(parseShareTokenFromPath("/share/shr_abcdefghijklmnopqrstu")).toBe(
      "shr_abcdefghijklmnopqrstu",
    );
    expect(isSharePreviewPath("/share/shr_abcdefghijklmnopqrstu")).toBe(true);
    expect(isSharePreviewPath("/share/shr_abcdefghijklmnopqrstu/")).toBe(true);
  });

  it("does not treat landing or legal routes as share previews", () => {
    expect(isSharePreviewPath("/")).toBe(false);
    expect(isSharePreviewPath("/terms")).toBe(false);
    expect(isSharePreviewPath("/privacy")).toBe(false);
    expect(isSharePreviewPath("/contact")).toBe(false);
    expect(isSharePreviewPath("/share")).toBe(false);
    expect(isSharePreviewPath("/share/a/b")).toBe(false);
  });
});
