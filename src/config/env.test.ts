import { describe, expect, it } from "vitest";
import {
  getFirebaseWebConfig,
  getPublicAppEnv,
  hasFirebaseWebConfig,
  MISSING_FIREBASE_WEB_CONFIG_MESSAGE,
} from "./env";

describe("getPublicAppEnv", () => {
  it("uses the default app name when the env value is missing", () => {
    const env = getPublicAppEnv({});

    expect(env.appName).toBe("Pocket Closet");
    expect(env.appStoreUrl).toBeUndefined();
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
    });

    expect(env.appStoreUrl).toBeUndefined();
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
