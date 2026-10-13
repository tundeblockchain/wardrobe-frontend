import { describe, expect, it } from "vitest";
import {
  appPaths,
  getAppItemEditPath,
  getAppItemNewPath,
  getAppItemPath,
  getAppOutfitEditPath,
  getAppOutfitNewPath,
  getAppPath,
  getAppWardrobeEditPath,
  getAppWardrobePath,
  getLoginPath,
  getLoginSignupPath,
  getPostLoginRedirectPath,
  isLoginSignupMode,
  getSafeInternalPath,
  getSharePath,
  isAppPath,
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
    expect(isSharePreviewPath("/login")).toBe(false);
    expect(isSharePreviewPath("/app")).toBe(false);
    expect(isSharePreviewPath("/share")).toBe(false);
    expect(isSharePreviewPath("/share/a/b")).toBe(false);
  });
});

describe("login and app paths", () => {
  it("keeps public routes and adds login plus the /app base", () => {
    expect(appPaths.home).toBe("/");
    expect(appPaths.terms).toBe("/terms");
    expect(appPaths.privacy).toBe("/privacy");
    expect(appPaths.contact).toBe("/contact");
    expect(appPaths.share).toBe("/share/:token");
    expect(appPaths.login).toBe("/login");
    expect(appPaths.app).toBe("/app");
    expect(appPaths.appWardrobes).toBe("/app/wardrobes");
    expect(appPaths.appWardrobeNew).toBe("/app/wardrobes/new");
    expect(appPaths.appWardrobe).toBe("/app/wardrobes/:id");
    expect(appPaths.appWardrobeEdit).toBe("/app/wardrobes/:id/edit");
    expect(appPaths.appWardrobeItemNew).toBe("/app/wardrobes/:id/items/new");
    expect(appPaths.appItem).toBe("/app/items/:id");
    expect(appPaths.appItemEdit).toBe("/app/items/:id/edit");
    expect(appPaths.appOutfits).toBe("/app/outfits");
    expect(appPaths.appOutfitNew).toBe("/app/outfits/new");
    expect(appPaths.appOutfitEdit).toBe("/app/outfits/:id/edit");
    expect(appPaths.appVirtualProfiles).toBe("/app/virtual-profiles");
    expect(appPaths.appPlan).toBe("/app/plan");
  });

  it("builds /app and nested /app/* paths", () => {
    expect(getAppPath()).toBe("/app");
    expect(getAppPath("/")).toBe("/app");
    expect(getAppPath("x")).toBe("/app/x");
    expect(getAppPath("/x")).toBe("/app/x");
    expect(getAppPath("/x/")).toBe("/app/x");
    expect(getAppPath("looks/saved")).toBe("/app/looks/saved");
    expect(getAppWardrobePath("wd_weekend01")).toBe("/app/wardrobes/wd_weekend01");
    expect(getAppWardrobeEditPath("wd_weekend01")).toBe(
      "/app/wardrobes/wd_weekend01/edit",
    );
    expect(getAppItemNewPath("wd_weekend01")).toBe(
      "/app/wardrobes/wd_weekend01/items/new",
    );
    expect(getAppItemPath("item_navytee01")).toBe("/app/items/item_navytee01");
    expect(getAppItemPath("item_navytee01", "wd_weekend01")).toBe(
      "/app/items/item_navytee01?wardrobeId=wd_weekend01",
    );
    expect(getAppItemEditPath("item_navytee01", "wd_weekend01")).toBe(
      "/app/items/item_navytee01/edit?wardrobeId=wd_weekend01",
    );
    expect(getAppOutfitNewPath("wd_weekend01")).toBe(
      "/app/outfits/new?wardrobeId=wd_weekend01",
    );
    expect(getAppOutfitEditPath("outfit_brunch01", "wd_weekend01")).toBe(
      "/app/outfits/outfit_brunch01/edit?wardrobeId=wd_weekend01",
    );
  });

  it("detects /app and nested app paths", () => {
    expect(isAppPath("/app")).toBe(true);
    expect(isAppPath("/app/")).toBe(true);
    expect(isAppPath("/app/x")).toBe(true);
    expect(isAppPath("/app/looks/saved")).toBe(true);
    expect(isAppPath("/")).toBe(false);
    expect(isAppPath("/login")).toBe(false);
    expect(isAppPath("/application")).toBe(false);
    expect(isAppPath("/contact")).toBe(false);
  });

  it("builds a login URL that preserves the intended path", () => {
    expect(getLoginPath()).toBe("/login");
    expect(getLoginPath("/app")).toBe("/login?next=%2Fapp");
    expect(getLoginPath("/app/x")).toBe("/login?next=%2Fapp%2Fx");
  });

  it("builds a signup deep link on /login", () => {
    expect(getLoginSignupPath()).toBe("/login?mode=signup");
    expect(getLoginSignupPath("/app")).toBe("/login?next=%2Fapp&mode=signup");
    expect(getLoginPath(undefined, "signup")).toBe("/login?mode=signup");
    expect(isLoginSignupMode("signup")).toBe(true);
    expect(isLoginSignupMode("signIn")).toBe(false);
    expect(isLoginSignupMode(null)).toBe(false);
  });

  it("accepts only internal next paths", () => {
    expect(getSafeInternalPath("/app")).toBe("/app");
    expect(getSafeInternalPath("/app/x?tab=saved")).toBe("/app/x?tab=saved");
    expect(getSafeInternalPath("https://example.com")).toBeUndefined();
    expect(getSafeInternalPath("//example.com")).toBeUndefined();
    expect(getSafeInternalPath("login")).toBeUndefined();
  });

  it("redirects to next or router state after sign-in and defaults to /app", () => {
    expect(getPostLoginRedirectPath("/app/x")).toBe("/app/x");
    expect(getPostLoginRedirectPath(null, "/app/looks")).toBe("/app/looks");
    expect(getPostLoginRedirectPath("/login", "/app/x")).toBe("/app/x");
    expect(getPostLoginRedirectPath("https://example.com")).toBe("/app");
    expect(getPostLoginRedirectPath()).toBe("/app");
  });
});
