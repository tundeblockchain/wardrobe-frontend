import type { Page } from "@playwright/test";
import {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_TOKEN,
  E2E_ADMIN_USER_ID,
} from "./adminSupportApiMock";
import { mockFirebaseAuthNetwork } from "./signedInApp";
import { seedConsent } from "./trackingHelpers";

export type E2EAdminSessionSeed = {
  admin: boolean;
  signedOut?: boolean;
};

export const seedE2EAdminSession = async (
  page: Page,
  session: E2EAdminSessionSeed = { admin: true },
): Promise<void> => {
  await page.addInitScript(
    ({ signedOut, admin, user, idToken }) => {
      window.__E2E_ADMIN_SESSION__ = signedOut
        ? null
        : {
            user,
            admin,
            idToken,
          };
    },
    {
      signedOut: session.signedOut === true,
      admin: session.admin,
      user: { id: E2E_ADMIN_USER_ID, email: E2E_ADMIN_EMAIL },
      idToken: E2E_ADMIN_TOKEN,
    },
  );
};

export const openAdminSupport = async (
  page: Page,
  session: E2EAdminSessionSeed = { admin: true },
  consent: { analytics: boolean; marketing: boolean } = {
    analytics: false,
    marketing: false,
  },
): Promise<void> => {
  await seedConsent(page, consent);
  await seedE2EAdminSession(page, session);
  await mockFirebaseAuthNetwork(page);
};
