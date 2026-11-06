import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicAppEnv } from "./env";
import {
  CHECKOUT_SUCCESS_STORAGE_KEY,
  MISSING_CHECKOUT_SESSION_KEY,
  isStripeCheckoutSessionId,
  isTrackingDebugEnabled,
  readCheckoutSessionId,
  sanitizeTrackingParams,
  TRACKING_EVENT_MAP,
  trackCheckoutSuccess,
  trackEvent,
  trackSpaPageView,
  trackStoreCtaClick,
} from "./trackingEvents";
import {
  STORE_CTA_GA_EVENT,
  STORE_CTA_META_EVENT,
  STORE_CTA_TIKTOK_EVENT,
} from "./tracking";

const ALL_IDS = {
  gaMeasurementId: "G-XXXXXXXXXX",
  metaPixelId: "000000000000000",
  tiktokPixelId: "CXXXXXXXXXXXXXXXXX",
} as const;

const installVendors = () => {
  window.gtag = vi.fn();
  window.fbq = vi.fn();
  window.ttq = Object.assign(vi.fn(), {
    track: vi.fn(),
    page: vi.fn(),
    identify: vi.fn(),
  });
};

describe("isTrackingDebugEnabled", () => {
  it("is on in DEV and when VITE_TRACKING_DEBUG is true", () => {
    expect(isTrackingDebugEnabled({ DEV: true })).toBe(true);
    expect(isTrackingDebugEnabled({ DEV: false, VITE_TRACKING_DEBUG: "true" })).toBe(
      true,
    );
    expect(isTrackingDebugEnabled({ DEV: false, VITE_TRACKING_DEBUG: "1" })).toBe(
      true,
    );
    expect(
      isTrackingDebugEnabled({ DEV: false, VITE_TRACKING_DEBUG: "false" }),
    ).toBe(false);
    expect(isTrackingDebugEnabled({ DEV: false })).toBe(false);
  });
});

describe("event mapping", () => {
  it("maps each action to GA4, Meta, and TikTok names", () => {
    expect(TRACKING_EVENT_MAP.store_cta_click).toEqual({
      ga: STORE_CTA_GA_EVENT,
      meta: { name: STORE_CTA_META_EVENT, standard: false },
      tiktok: { name: STORE_CTA_TIKTOK_EVENT, standard: true },
    });
    expect(TRACKING_EVENT_MAP.sign_up.meta).toEqual({
      name: "CompleteRegistration",
      standard: true,
    });
    expect(TRACKING_EVENT_MAP.sign_up.tiktok.name).toBe("CompleteRegistration");
    expect(TRACKING_EVENT_MAP.login.meta.standard).toBe(false);
    expect(TRACKING_EVENT_MAP.contact.meta.name).toBe("Contact");
    expect(TRACKING_EVENT_MAP.contact.tiktok.name).toBe("Contact");
    expect(TRACKING_EVENT_MAP.view_pricing.meta.name).toBe("ViewContent");
    expect(TRACKING_EVENT_MAP.add_to_wishlist.meta.name).toBe("AddToWishlist");
    expect(TRACKING_EVENT_MAP.search.meta.name).toBe("Search");
    expect(TRACKING_EVENT_MAP.initiate_checkout.ga).toBe("begin_checkout");
    expect(TRACKING_EVENT_MAP.initiate_checkout.meta.name).toBe(
      "InitiateCheckout",
    );
    expect(TRACKING_EVENT_MAP.subscribe.meta.name).toBe("Subscribe");
    expect(TRACKING_EVENT_MAP.subscribe.tiktok.name).toBe("Subscribe");
    expect(TRACKING_EVENT_MAP).not.toHaveProperty("start_trial");
  });
});

describe("sanitizeTrackingParams", () => {
  it("strips personal data, IDs, URLs, and search terms", () => {
    const sanitized = sanitizeTrackingParams({
      store: "appStore",
      email: "person@example.com",
      name: "Ada",
      user_id: "user-1",
      item_id: "item_navytee01",
      wardrobe_id: "wd_weekend01",
      search_term: "navy tee",
      url: "https://example.com/app/items/item_navytee01",
      page_location: "/app/wardrobes/wd_weekend01",
      filter_type: "wardrobe",
      result_count: 3,
      leaked: "person@example.com",
      raw_id: "wd_weekend01",
      session_id: "cs_test_abc",
    });

    expect(sanitized).toEqual({
      store: "appStore",
      filter_type: "wardrobe",
      result_count: 3,
    });
    expect(JSON.stringify(sanitized)).not.toMatch(/@/);
    expect(JSON.stringify(sanitized)).not.toContain("Ada");
    expect(JSON.stringify(sanitized)).not.toContain("navy tee");
    expect(JSON.stringify(sanitized)).not.toContain("wd_weekend01");
    expect(JSON.stringify(sanitized)).not.toContain("user-1");
    expect(JSON.stringify(sanitized)).not.toContain("cs_test_abc");
    expect(sanitized).not.toHaveProperty("session_id");
  });
});

describe("trackEvent", () => {
  afterEach(() => {
    delete window.gtag;
    delete window.fbq;
    delete window.ttq;
    delete window.__WARDROBE_E2E_TRACKING_IDS__;
  });

  it("is a no-op when no IDs are set", () => {
    installVendors();

    const result = trackEvent("sign_up", { method: "email" }, { ids: {} });

    expect(result).toEqual({
      googleAnalytics: false,
      metaPixel: false,
      tiktokPixel: false,
    });
    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.fbq).not.toHaveBeenCalled();
    expect(window.ttq?.track).not.toHaveBeenCalled();
  });

  it("is a no-op when IDs are blank in env", () => {
    installVendors();

    const result = trackEvent(
      "login",
      { method: "email" },
      { ids: getPublicAppEnv({}) },
    );

    expect(result).toEqual({
      googleAnalytics: false,
      metaPixel: false,
      tiktokPixel: false,
    });
    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.fbq).not.toHaveBeenCalled();
  });

  it("does not call vendors when IDs are valid but scripts are missing", () => {
    const result = trackEvent("logout", undefined, { ids: ALL_IDS });

    expect(result.googleAnalytics).toBe(false);
    expect(result.metaPixel).toBe(false);
    expect(result.tiktokPixel).toBe(false);
    expect(window.gtag).toBeUndefined();
    expect(window.fbq).toBeUndefined();
    expect(window.ttq).toBeUndefined();
  });

  it("fans a standard event out to gtag, fbq track, and ttq.track with event IDs", () => {
    installVendors();

    const result = trackEvent(
      "sign_up",
      { method: "email" },
      { ids: ALL_IDS, eventId: "evt_signup_1" },
    );

    expect(result).toEqual({
      googleAnalytics: true,
      metaPixel: true,
      tiktokPixel: true,
      eventId: "evt_signup_1",
    });
    expect(window.gtag).toHaveBeenCalledWith("event", "sign_up", {
      method: "email",
    });
    expect(window.fbq).toHaveBeenCalledWith(
      "track",
      "CompleteRegistration",
      { method: "email" },
      { eventID: "evt_signup_1" },
    );
    expect(window.ttq?.track).toHaveBeenCalledWith(
      "CompleteRegistration",
      { method: "email" },
      { event_id: "evt_signup_1" },
    );
  });

  it("generates an event_id for non-purchase events when none is passed", () => {
    installVendors();

    const result = trackEvent("login", { method: "email" }, { ids: ALL_IDS });

    expect(result.eventId).toEqual(expect.any(String));
    expect(window.fbq).toHaveBeenCalledWith(
      "trackCustom",
      "Login",
      { method: "email" },
      { eventID: result.eventId },
    );
    expect(window.ttq?.track).toHaveBeenCalledWith(
      "Login",
      { method: "email" },
      { event_id: result.eventId },
    );
  });

  it("uses trackCustom for non-standard Meta events", () => {
    installVendors();

    trackEvent("login", { method: "google" }, { ids: ALL_IDS, eventId: "evt_1" });

    expect(window.fbq).toHaveBeenCalledWith(
      "trackCustom",
      "Login",
      { method: "google" },
      { eventID: "evt_1" },
    );
    expect(window.ttq?.track).toHaveBeenCalledWith(
      "Login",
      { method: "google" },
      { event_id: "evt_1" },
    );
  });

  it("attaches env test codes when provided", () => {
    installVendors();

    trackEvent(
      "subscribe",
      { tier: "basic" },
      {
        ids: ALL_IDS,
        eventId: "cs_test_abc",
        testCodes: {
          metaTestEventCode: "TESTMETA",
          tiktokTestEventCode: "TESTTT",
        },
      },
    );

    expect(window.fbq).toHaveBeenCalledWith(
      "track",
      "Subscribe",
      { tier: "basic" },
      { eventID: "cs_test_abc", test_event_code: "TESTMETA" },
    );
    expect(window.ttq?.track).toHaveBeenCalledWith(
      "Subscribe",
      { tier: "basic" },
      { event_id: "cs_test_abc", test_event_code: "TESTTT" },
    );
  });

  it("logs each event with console.debug when debug is enabled", () => {
    installVendors();
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

    trackEvent("logout", undefined, { ids: ALL_IDS, eventId: "evt_debug" });

    expect(debugSpy).toHaveBeenCalledWith(
      "[tracking]",
      "logout",
      expect.objectContaining({
        ga: "logout",
        meta: "Logout",
        tiktok: "Logout",
        eventId: "evt_debug",
      }),
    );
    debugSpy.mockRestore();
  });

  it("does not send personal data in vendor payloads", () => {
    installVendors();

    trackEvent(
      "add_item",
      {
        category: "TOP",
        name: "Navy tee",
        email: "person@example.com",
        item_id: "item_navytee01",
      },
      { ids: ALL_IDS, eventId: "evt_item" },
    );

    const gaPayload = (window.gtag as ReturnType<typeof vi.fn>).mock.calls[0]?.[2];
    const metaPayload = (window.fbq as ReturnType<typeof vi.fn>).mock.calls[0]?.[2];
    const tiktokPayload = (window.ttq?.track as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[1];

    expect(gaPayload).toEqual({ category: "TOP" });
    expect(metaPayload).toEqual({ category: "TOP" });
    expect(tiktokPayload).toEqual({ category: "TOP" });
    expect(JSON.stringify([gaPayload, metaPayload, tiktokPayload])).not.toMatch(
      /Navy tee|@|item_navytee01/,
    );
  });
});

describe("trackSpaPageView", () => {
  afterEach(() => {
    delete window.gtag;
    delete window.fbq;
    delete window.ttq;
  });

  it("sends templated paths and never raw IDs", () => {
    installVendors();

    trackSpaPageView(
      {
        pathname: "/app/wardrobes/wd_weekend01",
        search: "?tab=items",
      },
      { ids: ALL_IDS },
    );

    expect(window.gtag).toHaveBeenCalledWith("event", "page_view", {
      page_path: "/app/wardrobes/:id",
      page_title: "Wardrobe",
    });
    expect(window.fbq).toHaveBeenCalledWith(
      "track",
      "PageView",
      {
        page_path: "/app/wardrobes/:id",
        page_title: "Wardrobe",
      },
      expect.objectContaining({ eventID: expect.any(String) }),
    );
    expect(window.ttq?.track).toHaveBeenCalledWith(
      "PageView",
      {
        page_path: "/app/wardrobes/:id",
        page_title: "Wardrobe",
      },
      expect.objectContaining({ event_id: expect.any(String) }),
    );

    const serialized = JSON.stringify([
      (window.gtag as ReturnType<typeof vi.fn>).mock.calls,
      (window.fbq as ReturnType<typeof vi.fn>).mock.calls,
      (window.ttq?.track as ReturnType<typeof vi.fn>).mock.calls,
    ]);
    expect(serialized).not.toContain("wd_weekend01");
  });
});

describe("trackStoreCtaClick", () => {
  afterEach(() => {
    delete window.gtag;
    delete window.fbq;
    delete window.ttq;
  });

  it("does not fire click events when IDs are empty", () => {
    installVendors();

    const result = trackStoreCtaClick(
      { store: "appStore", placement: "hero" },
      getPublicAppEnv({}),
    );

    expect(result).toEqual({
      googleAnalytics: false,
      metaPixel: false,
      tiktokPixel: false,
    });
    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.fbq).not.toHaveBeenCalled();
    expect(window.ttq?.track).not.toHaveBeenCalled();
  });

  it("fires GA, Meta custom, and TikTok ClickButton", () => {
    installVendors();

    const result = trackStoreCtaClick(
      { store: "appStore", placement: "hero" },
      ALL_IDS,
    );

    expect(result).toEqual({
      googleAnalytics: true,
      metaPixel: true,
      tiktokPixel: true,
    });
    expect(window.gtag).toHaveBeenCalledWith("event", STORE_CTA_GA_EVENT, {
      store: "appStore",
      placement: "hero",
    });
    expect(window.fbq).toHaveBeenCalledWith(
      "trackCustom",
      STORE_CTA_META_EVENT,
      {
        store: "appStore",
        placement: "hero",
      },
      expect.objectContaining({ eventID: expect.any(String) }),
    );
    expect(window.ttq?.track).toHaveBeenCalledWith(
      STORE_CTA_TIKTOK_EVENT,
      {
        store: "appStore",
        placement: "hero",
      },
      expect.objectContaining({ event_id: expect.any(String) }),
    );
  });

  it("never sends page_view or PageView from a store CTA click", () => {
    installVendors();

    trackStoreCtaClick(
      { store: "appStore", placement: "download" },
      ALL_IDS,
    );

    expect(window.gtag).not.toHaveBeenCalledWith(
      "event",
      "page_view",
      expect.anything(),
    );
    expect(window.fbq).not.toHaveBeenCalledWith(
      "track",
      "PageView",
      expect.anything(),
      expect.anything(),
    );
  });
});

describe("checkout success Subscribe", () => {
  afterEach(() => {
    delete window.gtag;
    delete window.fbq;
    delete window.ttq;
    window.sessionStorage.clear();
  });

  it("reads cs_ session ids and ignores other query values", () => {
    expect(isStripeCheckoutSessionId("cs_test_abc")).toBe(true);
    expect(isStripeCheckoutSessionId("cs_live123")).toBe(true);
    expect(isStripeCheckoutSessionId("not-a-session")).toBe(false);
    expect(readCheckoutSessionId("?session_id=cs_test_abc&foo=1")).toBe(
      "cs_test_abc",
    );
    expect(readCheckoutSessionId("?session_id=nope")).toBeUndefined();
  });

  it("fires Subscribe once per session id as stripe_<checkoutSessionId>", () => {
    installVendors();

    const first = trackCheckoutSuccess(
      { sessionId: "cs_test_once", tier: "basic", interval: "monthly" },
      { ids: ALL_IDS },
    );
    const second = trackCheckoutSuccess(
      { sessionId: "cs_test_once", tier: "basic", interval: "monthly" },
      { ids: ALL_IDS },
    );

    expect(first.metaPixel).toBe(true);
    expect(first.eventId).toBe("stripe_cs_test_once");
    expect(second.metaPixel).toBe(false);
    expect(window.fbq).toHaveBeenCalledTimes(1);
    expect(window.fbq).toHaveBeenCalledWith(
      "track",
      "Subscribe",
      { tier: "basic", interval: "monthly" },
      { eventID: "stripe_cs_test_once" },
    );
    expect(window.ttq?.track).toHaveBeenCalledWith(
      "Subscribe",
      { tier: "basic", interval: "monthly" },
      { event_id: "stripe_cs_test_once" },
    );
    expect(window.sessionStorage.getItem(CHECKOUT_SUCCESS_STORAGE_KEY)).toContain(
      "cs_test_once",
    );
    expect(JSON.stringify((window.fbq as ReturnType<typeof vi.fn>).mock.calls)).not.toContain(
      `"cs_test_once"`,
    );
    expect((window.fbq as ReturnType<typeof vi.fn>).mock.calls[0]?.[2]).not.toHaveProperty(
      "session_id",
    );
  });

  it("always sends Subscribe for web checkout, never StartTrial", () => {
    installVendors();

    trackCheckoutSuccess(
      { sessionId: "cs_test_trial", tier: "premium" },
      { ids: ALL_IDS },
    );

    expect(window.fbq).toHaveBeenCalledWith(
      "track",
      "Subscribe",
      { tier: "premium" },
      { eventID: "stripe_cs_test_trial" },
    );
    expect(window.ttq?.track).toHaveBeenCalledWith(
      "Subscribe",
      { tier: "premium" },
      { event_id: "stripe_cs_test_trial" },
    );
    expect(window.fbq).not.toHaveBeenCalledWith(
      "track",
      "StartTrial",
      expect.anything(),
      expect.anything(),
    );
  });

  it("fires Subscribe without event_id when session_id is missing", () => {
    installVendors();

    const result = trackCheckoutSuccess(
      { sessionId: null },
      { ids: ALL_IDS, eventId: "should-not-be-used" },
    );

    expect(result.eventId).toBeUndefined();
    expect(window.fbq).toHaveBeenCalledWith("track", "Subscribe", {});
    expect(window.fbq).not.toHaveBeenCalledWith(
      "track",
      "Subscribe",
      {},
      expect.anything(),
    );
    expect(window.ttq?.track).toHaveBeenCalledWith("Subscribe", {});
    expect(window.sessionStorage.getItem(CHECKOUT_SUCCESS_STORAGE_KEY)).toContain(
      MISSING_CHECKOUT_SESSION_KEY,
    );

    const second = trackCheckoutSuccess({ sessionId: null }, { ids: ALL_IDS });
    expect(second.metaPixel).toBe(false);
    expect(window.fbq).toHaveBeenCalledTimes(1);
  });

});
