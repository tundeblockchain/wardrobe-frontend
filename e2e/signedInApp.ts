import { expect, type Page } from "@playwright/test";
import {
  E2E_FIREBASE_API_KEY,
  E2E_FIREBASE_APP_NAME,
  E2E_USER_EMAIL,
  E2E_USER_ID,
} from "./env";

const encodeJwtPart = (value: object): string => {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
};

export const e2eIdToken = (): string => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return [
    encodeJwtPart({ alg: "none", typ: "JWT" }),
    encodeJwtPart({
      iss: "https://securetoken.google.com/playwright-project",
      aud: "playwright-project",
      auth_time: nowSeconds,
      user_id: E2E_USER_ID,
      sub: E2E_USER_ID,
      iat: nowSeconds,
      exp: nowSeconds + 86_400,
      email: E2E_USER_EMAIL,
      email_verified: true,
      firebase: {
        identities: { email: [E2E_USER_EMAIL] },
        sign_in_provider: "password",
      },
    }),
    "playwright",
  ].join(".");
};

const persistedFirebaseUser = () => {
  const accessToken = e2eIdToken();
  return {
    uid: E2E_USER_ID,
    email: E2E_USER_EMAIL,
    emailVerified: true,
    displayName: "Wish list tester",
    isAnonymous: false,
    photoURL: undefined,
    phoneNumber: undefined,
    providerData: [
      {
        providerId: "password",
        uid: E2E_USER_ID,
        displayName: "Wish list tester",
        email: E2E_USER_EMAIL,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    stsTokenManager: {
      refreshToken: "playwright-refresh-token",
      accessToken,
      expirationTime: Date.now() + 86_400_000,
    },
    createdAt: String(Date.now()),
    lastLoginAt: String(Date.now()),
    apiKey: E2E_FIREBASE_API_KEY,
    appName: E2E_FIREBASE_APP_NAME,
  };
};

export const mockFirebaseAuthNetwork = async (page: Page): Promise<void> => {
  const token = e2eIdToken();
  const accountInfo = {
    users: [
      {
        localId: E2E_USER_ID,
        email: E2E_USER_EMAIL,
        emailVerified: true,
        displayName: "Wish list tester",
        providerUserInfo: [
          {
            providerId: "password",
            federatedId: E2E_USER_EMAIL,
            email: E2E_USER_EMAIL,
            rawId: E2E_USER_ID,
          },
        ],
        validSince: "0",
        lastLoginAt: String(Date.now()),
        createdAt: String(Date.now()),
      },
    ],
  };

  await page.route(
    (url) =>
      /identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com|firebaseinstallations\.googleapis\.com|firebase\.googleapis\.com/.test(
        url.hostname,
      ),
    async (route) => {
      const requestUrl = route.request().url();
      if (requestUrl.includes("/v1/token")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            access_token: token,
            expires_in: "3600",
            token_type: "Bearer",
            refresh_token: "playwright-refresh-token",
            id_token: token,
            user_id: E2E_USER_ID,
            project_id: "playwright-project",
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(accountInfo),
      });
    },
  );
};

export const seedFirebaseAuth = async (page: Page): Promise<void> => {
  await page.addInitScript(
    async ({ apiKey, appName, user }) => {
      const databaseName = "firebaseLocalStorageDb";
      const storeName = "firebaseLocalStorage";
      const key = `firebase:authUser:${apiKey}:${appName}`;

      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(databaseName, 1);
        request.onerror = () => {
          reject(request.error ?? new Error("Could not open auth storage."));
        };
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(storeName)) {
            database.createObjectStore(storeName, { keyPath: "fbase_key" });
          }
        };
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(storeName, "readwrite");
          const store = transaction.objectStore(storeName);
          store.put({ fbase_key: key, value: user });
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => {
            reject(
              transaction.error ?? new Error("Could not seed auth storage."),
            );
          };
        };
      });
    },
    {
      apiKey: E2E_FIREBASE_API_KEY,
      appName: E2E_FIREBASE_APP_NAME,
      user: persistedFirebaseUser(),
    },
  );
};

export const openSignedInHome = async (page: Page): Promise<void> => {
  await page.goto("/app");
  await expect(
    page.getByRole("heading", { level: 1, name: "Your closet" }),
  ).toBeVisible();
};
