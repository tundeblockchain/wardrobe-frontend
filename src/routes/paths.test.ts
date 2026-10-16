import { describe, expect, it } from "vitest";
import {
  appPaths,
  getAppItemEditPath,
  getAppItemNewPath,
  getAppItemPath,
  getAppOutfitEditPath,
  getAppOutfitNewPath,
  getAppVirtualProfileEditPath,
  getAppVirtualTryOnPath,
  VIRTUAL_TRY_ON_ITEM_QUERY_PARAM,
  VIRTUAL_TRY_ON_OUTFIT_QUERY_PARAM,
  WARDROBE_ID_QUERY_PARAM,
  getAppPath,
  getAppSettingsPlanPath,
  getPricingPath,
  getAppWardrobeEditPath,
  getAppWardrobePath,
  getAppWardrobeRecommendationDetailPath,
  getAppWardrobeRecommendationsPath,
  getLoginPath,
  SETTINGS_PLAN_HASH,
  getLoginSignupPath,
  getPostLoginRedirectPath,
  isLoginSignupMode,
  getSafeInternalPath,
  getSharePath,
  getContactPath,
  isAppPath,
  isContactBugType,
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
    expect(isSharePreviewPath("/pricing")).toBe(false);
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
    expect(appPaths.pricing).toBe("/pricing");
    expect(appPaths.share).toBe("/share/:token");
    expect(appPaths.login).toBe("/login");
    expect(appPaths.app).toBe("/app");
    expect(appPaths.appWardrobes).toBe("/app/wardrobes");
    expect(appPaths.appWardrobeNew).toBe("/app/wardrobes/new");
    expect(appPaths.appWardrobe).toBe("/app/wardrobes/:id");
    expect(appPaths.appWardrobeEdit).toBe("/app/wardrobes/:id/edit");
    expect(appPaths.appWardrobeItemNew).toBe("/app/wardrobes/:id/items/new");
    expect(appPaths.appWardrobeRecommendations).toBe(
      "/app/wardrobes/:id/recommendations",
    );
    expect(appPaths.appWardrobeRecommendationDetail).toBe(
      "/app/wardrobes/:id/recommendations/detail",
    );
    expect(appPaths.appItem).toBe("/app/items/:id");
    expect(appPaths.appItemEdit).toBe("/app/items/:id/edit");
    expect(appPaths.appOutfits).toBe("/app/outfits");
    expect(appPaths.appOutfitNew).toBe("/app/outfits/new");
    expect(appPaths.appOutfitEdit).toBe("/app/outfits/:id/edit");
    expect(appPaths.appVirtualProfiles).toBe("/app/virtual-profiles");
    expect(appPaths.appVirtualProfileNew).toBe("/app/virtual-profiles/new");
    expect(appPaths.appVirtualProfileEdit).toBe(
      "/app/virtual-profiles/:id/edit",
    );
    expect(appPaths.appVirtualTryOn).toBe("/app/virtual-try-on");
    expect(appPaths.appSettings).toBe("/app/settings");
    expect(appPaths.appPricing).toBe("/app/pricing");
    expect(appPaths.appPlan).toBe("/app/settings#plan");
    expect(appPaths.appSettingsPlan).toBe("/app/settings#plan");
    expect(SETTINGS_PLAN_HASH).toBe("plan");
    expect(getAppSettingsPlanPath()).toBe("/app/settings#plan");
    expect(getPricingPath()).toBe("/pricing");
    expect(getPricingPath("/pricing")).toBe("/pricing");
    expect(getPricingPath("/app/settings")).toBe("/app/pricing");
    expect(appPaths.appBillingSuccess).toBe("/app/billing/success");
    expect(appPaths.appBillingCancel).toBe("/app/billing/cancel");
    expect(getContactPath()).toBe("/contact");
    expect(getContactPath("bug")).toBe("/contact?type=bug");
    expect(isContactBugType("bug")).toBe(true);
    expect(isContactBugType("support")).toBe(false);
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
    expect(getAppWardrobeRecommendationsPath("wd_weekend01")).toBe(
      "/app/wardrobes/wd_weekend01/recommendations",
    );
    expect(getAppWardrobeRecommendationDetailPath("wd_weekend01")).toBe(
      "/app/wardrobes/wd_weekend01/recommendations/detail",
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
    expect(getAppVirtualProfileEditPath("aip_personal01")).toBe(
      "/app/virtual-profiles/aip_personal01/edit",
    );
    expect(getAppVirtualTryOnPath()).toBe("/app/virtual-try-on");
    expect(
      getAppVirtualTryOnPath({
        itemId: "item_navytee01",
        wardrobeId: "wd_weekend01",
      }),
    ).toBe(
      `/app/virtual-try-on?${WARDROBE_ID_QUERY_PARAM}=wd_weekend01&${VIRTUAL_TRY_ON_ITEM_QUERY_PARAM}=item_navytee01`,
    );
    expect(
      getAppVirtualTryOnPath({
        outfitId: "outfit_brunch01",
        wardrobeId: "wd_weekend01",
      }),
    ).toBe(
      `/app/virtual-try-on?${WARDROBE_ID_QUERY_PARAM}=wd_weekend01&${VIRTUAL_TRY_ON_OUTFIT_QUERY_PARAM}=outfit_brunch01`,
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
