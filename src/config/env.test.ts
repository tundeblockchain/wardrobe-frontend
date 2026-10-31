import { describe, expect, it } from "vitest";
import {
  DEFAULT_APP_STORE_URL,
  getFirebaseWebConfig,
  getPublicAppEnv,
  hasFirebaseWebConfig,
  MISSING_FIREBASE_WEB_CONFIG_MESSAGE,
  resolveAppStoreUrl,
} from "./env";
import { isMockApi } from "./mockApi";

describe("getPublicAppEnv", () => {
  it("uses the default app name when the env value is missing", () => {
    const env = getPublicAppEnv({});

    expect(env.appName).toBe("Pocket Closet");
    expect(env.appStoreUrl).toBe(DEFAULT_APP_STORE_URL);
    expect(env.playStoreUrl).toBeUndefined();
    expect(env.publicSiteUrl).toBeUndefined();
    expect(env.apiBaseUrl).toBeUndefined();
    expect(env.gaMeasurementId).toBeUndefined();
    expect(env.metaPixelId).toBeUndefined();
    expect(env.legalContactEmail).toBeUndefined();
    expect(env.legalContactUrl).toBeUndefined();
    expect(env.firebaseApiKey).toBeUndefined();
    expect(env.firebaseAuthDomain).toBeUndefined();
    expect(env.firebaseProjectId).toBeUndefined();
    expect(env.firebaseStorageBucket).toBeUndefined();
    expect(env.firebaseMessagingSenderId).toBeUndefined();
    expect(env.firebaseAppId).toBeUndefined();
    expect(env.useMockApi).toBe(false);
  });

  it("treats blank placeholders as unset", () => {
    const env = getPublicAppEnv({
      VITE_APP_STORE_URL: "   ",
      VITE_PLAY_STORE_URL: "",
      VITE_PUBLIC_SITE_URL: "  ",
      VITE_API_BASE_URL: " ",
      VITE_GA_MEASUREMENT_ID: " \n",
      VITE_META_PIXEL_ID: "  ",
      VITE_LEGAL_CONTACT_EMAIL: "   ",
      VITE_LEGAL_CONTACT_URL: " ",
      VITE_FIREBASE_API_KEY: "  ",
      VITE_FIREBASE_AUTH_DOMAIN: "",
      VITE_FIREBASE_PROJECT_ID: " ",
      VITE_FIREBASE_STORAGE_BUCKET: "\n",
      VITE_FIREBASE_MESSAGING_SENDER_ID: "  ",
      VITE_FIREBASE_APP_ID: " ",
      VITE_USE_MOCK_API: "  ",
    });

    expect(env.appStoreUrl).toBe(DEFAULT_APP_STORE_URL);
    expect(env.playStoreUrl).toBeUndefined();
    expect(env.publicSiteUrl).toBeUndefined();
    expect(env.apiBaseUrl).toBeUndefined();
    expect(env.gaMeasurementId).toBeUndefined();
    expect(env.metaPixelId).toBeUndefined();
    expect(env.legalContactEmail).toBeUndefined();
    expect(env.legalContactUrl).toBeUndefined();
    expect(env.firebaseApiKey).toBeUndefined();
    expect(env.firebaseAuthDomain).toBeUndefined();
    expect(env.firebaseProjectId).toBeUndefined();
    expect(env.firebaseStorageBucket).toBeUndefined();
    expect(env.firebaseMessagingSenderId).toBeUndefined();
    expect(env.firebaseAppId).toBeUndefined();
    expect(env.useMockApi).toBe(false);
  });

  it("trims configured public identifiers", () => {
    const env = getPublicAppEnv({
      VITE_APP_NAME: " Wardrobe ",
      VITE_APP_STORE_URL: " https://apps.apple.com/app/id000000000 ",
      VITE_PLAY_STORE_URL: " https://play.google.com/store/apps/details?id=com.example.wardrobe ",
      VITE_PUBLIC_SITE_URL: " https://example.com/ ",
      VITE_API_BASE_URL: " https://api.example.com/ ",
      VITE_GA_MEASUREMENT_ID: " G-XXXXXXXXXX ",
      VITE_META_PIXEL_ID: " 000000000000000 ",
      VITE_LEGAL_CONTACT_EMAIL: " legal@example.com ",
      VITE_LEGAL_CONTACT_URL: " https://example.com/contact ",
      VITE_FIREBASE_API_KEY: " test-api-key ",
      VITE_FIREBASE_AUTH_DOMAIN: " test.firebaseapp.com ",
      VITE_FIREBASE_PROJECT_ID: " test-project ",
      VITE_FIREBASE_STORAGE_BUCKET: " test-project.appspot.com ",
      VITE_FIREBASE_MESSAGING_SENDER_ID: " 123456789 ",
      VITE_FIREBASE_APP_ID: " 1:123456789:web:abc ",
      VITE_USE_MOCK_API: " true ",
    });

    expect(env.appName).toBe("Wardrobe");
    expect(env.appStoreUrl).toBe("https://apps.apple.com/app/id000000000");
    expect(env.playStoreUrl).toBe(
      "https://play.google.com/store/apps/details?id=com.example.wardrobe",
    );
    expect(env.publicSiteUrl).toBe("https://example.com");
    expect(env.apiBaseUrl).toBe("https://api.example.com");
    expect(env.gaMeasurementId).toBe("G-XXXXXXXXXX");
    expect(env.metaPixelId).toBe("000000000000000");
    expect(env.legalContactEmail).toBe("legal@example.com");
    expect(env.legalContactUrl).toBe("https://example.com/contact");
    expect(env.firebaseApiKey).toBe("test-api-key");
    expect(env.firebaseAuthDomain).toBe("test.firebaseapp.com");
    expect(env.firebaseProjectId).toBe("test-project");
    expect(env.firebaseStorageBucket).toBe("test-project.appspot.com");
    expect(env.firebaseMessagingSenderId).toBe("123456789");
    expect(env.firebaseAppId).toBe("1:123456789:web:abc");
    expect(env.useMockApi).toBe(true);
  });
});

describe("VITE_USE_MOCK_API", () => {
  it("defaults to false and accepts true or 1", () => {
    expect(getPublicAppEnv({}).useMockApi).toBe(false);
    expect(getPublicAppEnv({ VITE_USE_MOCK_API: "false" }).useMockApi).toBe(
      false,
    );
    expect(getPublicAppEnv({ VITE_USE_MOCK_API: "0" }).useMockApi).toBe(false);
    expect(getPublicAppEnv({ VITE_USE_MOCK_API: "true" }).useMockApi).toBe(true);
    expect(getPublicAppEnv({ VITE_USE_MOCK_API: "1" }).useMockApi).toBe(true);
    expect(isMockApi({ VITE_USE_MOCK_API: "TRUE" })).toBe(true);
    expect(isMockApi({})).toBe(false);
  });
});

describe("resolveAppStoreUrl", () => {
  it("falls back to the live App Store listing", () => {
    expect(resolveAppStoreUrl(undefined)).toBe(DEFAULT_APP_STORE_URL);
    expect(resolveAppStoreUrl("")).toBe(DEFAULT_APP_STORE_URL);
    expect(resolveAppStoreUrl("   ")).toBe(DEFAULT_APP_STORE_URL);
    expect(resolveAppStoreUrl(DEFAULT_APP_STORE_URL)).toBe(
      DEFAULT_APP_STORE_URL,
    );
    expect(
      resolveAppStoreUrl(" https://apps.apple.com/app/id000000000 "),
    ).toBe("https://apps.apple.com/app/id000000000");
  });
});

const completeFirebaseSource = {
  VITE_FIREBASE_API_KEY: "test-api-key",
  VITE_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "test-project",
  VITE_FIREBASE_STORAGE_BUCKET: "test-project.appspot.com",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "123456789",
  VITE_FIREBASE_APP_ID: "1:123456789:web:abc",
};

describe("getFirebaseWebConfig", () => {
  it("validates and returns the public Firebase web config", () => {
    expect(getFirebaseWebConfig(completeFirebaseSource)).toEqual({
      apiKey: "test-api-key",
      authDomain: "test.firebaseapp.com",
      projectId: "test-project",
      storageBucket: "test-project.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abc",
    });
    expect(hasFirebaseWebConfig(completeFirebaseSource)).toBe(true);
  });

  it("rejects missing or blank Firebase web config", () => {
    expect(() => getFirebaseWebConfig({})).toThrow(
      MISSING_FIREBASE_WEB_CONFIG_MESSAGE,
    );
    expect(() =>
      getFirebaseWebConfig({
        ...completeFirebaseSource,
        VITE_FIREBASE_API_KEY: " ",
      }),
    ).toThrow(MISSING_FIREBASE_WEB_CONFIG_MESSAGE);
    expect(hasFirebaseWebConfig({})).toBe(false);
  });
});
