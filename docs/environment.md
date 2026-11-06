# Environment variables

This app is a Vite SPA. Only variables prefixed with `VITE_` are available in the client bundle. Treat every `VITE_*` value as **public**.

Set values locally in `.env.local` (gitignored). For production, set the same keys in the **Netlify UI** (Site settings → Environment variables). The Netlify project owner configures the site; this repo only documents the names.

Never commit secrets, tokens, or private keys.

## Variables

| Name | Required | Purpose | Example placeholder |
| --- | --- | --- | --- |
| `VITE_APP_NAME` | No (defaults to `Pocket Closet`) | Display name in site chrome | `Pocket Closet` |
| `VITE_APP_STORE_URL` | No (defaults to the live App Store listing) | Public App Store URL for landing download CTAs. Empty or unset values use `https://apps.apple.com/gb/app/my-pocket-closet/id6809181010`. A Netlify value overrides this default and must be updated to the live URL if the key is set. | `https://apps.apple.com/gb/app/my-pocket-closet/id6809181010` |
| `VITE_PLAY_STORE_URL` | No | Public Play Store URL for landing download CTAs. Empty values render a disabled button. | `https://play.google.com/store/apps/details?id=com.example.wardrobe` |
| `VITE_PUBLIC_SITE_URL` | No | Public origin for canonical, Open Graph, and Twitter URLs (no trailing slash). When unset, the current origin is used in the browser. | `https://example.com` |
| `VITE_API_BASE_URL` | No | Public backend API origin (no trailing slash) for public routes (`GET /public/shares/{token}`, `POST /support/contact`, `GET /billing/plans`) and signed-in app calls (including `GET /me`). Empty values keep public pages rendering with a clear unavailable state. | `https://api.example.com` |
| `VITE_GA_MEASUREMENT_ID` | No | Google Analytics 4 measurement ID. Scripts are injected only when this value is a `G-` ID. | `G-XXXXXXXXXX` |
| `VITE_META_PIXEL_ID` | No | Meta Pixel ID. The pixel is injected only when this value is a numeric ID. Sends PageView on route changes plus in-app/website action events. | `000000000000000` |
| `VITE_TIKTOK_PIXEL_ID` | No | TikTok Pixel ID. The pixel is injected only when this value is an alphanumeric ID (`ttq.load(id)` + `ttq.page()`). Never commit a real ID. | `CXXXXXXXXXXXXXXXXX` |
| `VITE_TRACKING_DEBUG` | No (defaults to `false`) | When `true` or `1`, each tracking event is written with `console.debug`. Also on in Vite DEV. Keep false in production. | `false` |
| `VITE_META_TEST_EVENT_CODE` | No | Optional Meta Events Manager test code. Env only; never commit a value; leave blank in production. | |
| `VITE_TIKTOK_TEST_EVENT_CODE` | No | Optional TikTok Test Events code. Env only; never commit a value; leave blank in production. | |
| `VITE_LEGAL_CONTACT_EMAIL` | No | Public operator contact email shown on Terms of Service and Privacy Policy. Empty values show a store-listing contact fallback. | `legal@example.com` |
| `VITE_LEGAL_CONTACT_URL` | No | Optional public operator contact page shown on Terms of Service and Privacy Policy. | `https://example.com/contact` |
| `VITE_FIREBASE_API_KEY` | For `/login` and `/app` sign-in | Public Firebase web API key for the same project as the mobile app | |
| `VITE_FIREBASE_AUTH_DOMAIN` | For `/login` and `/app` sign-in | Public Firebase Auth domain | `example.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | For `/login` and `/app` sign-in | Firebase project ID | `example` |
| `VITE_FIREBASE_STORAGE_BUCKET` | For `/login` and `/app` sign-in | Firebase storage bucket | `example.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | For `/login` and `/app` sign-in | Firebase messaging sender ID | `000000000000` |
| `VITE_FIREBASE_APP_ID` | For `/login` and `/app` sign-in | Firebase web app ID | `1:000000000000:web:example` |
| `VITE_USE_MOCK_API` | No (defaults to `false`) | When `true` or `1`, signed-in app calls should use mock API responses instead of the live backend. Parsed by `isMockApi()` in `src/config/mockApi.ts`. | `false` |

Empty or whitespace-only values are treated as unset by `getPublicAppEnv()`.

Google Analytics, Meta Pixel, and TikTok Pixel snippets are omitted entirely when their IDs are missing, blank, or not a valid public identifier. Do not put real measurement IDs, test event codes, or debug flags in the repository.

Set the same `VITE_*` keys in the **Netlify UI** (Site settings → Environment variables) for production and deploy previews. Pixel IDs are public; still do not commit them.

There is **no cookie consent banner** in this frontend. Pixels load as soon as their env IDs are set. That is a product/legal decision still needed before enabling advertising pixels in production.

## Website and /app measurement events

`trackEvent` in `src/config/trackingEvents.ts` fans each action to GA4 (`gtag`), Meta (`fbq`), and TikTok (`ttq`). A vendor is called only when its env ID is valid **and** that vendor’s function is present. Wrappers no-op otherwise.

Event ids and identity:

- Non-purchase events: generated `event_id` (`crypto.randomUUID()`). Meta 4th `fbq` argument `{ eventID }`; TikTok `{ event_id }`.
- Subscribe: `event_id` = `stripe_<checkoutSessionId>` from `?session_id=` on the Stripe success URL. Meta `{ eventID }`, TikTok `{ event_id }`. No generated fallback: if `session_id` is missing, the event still fires without an `event_id`. De-duplicate per session id in `sessionStorage`. The raw session id is never sent in event params.
- The website never sends StartTrial. Web Stripe checkout does not set a trial (`subscription_data` is metadata only), so the server always classes a web checkout as Subscribe. Trial-to-paid conversions and renewals are server-only.
- Backend `success_url` is already `<origin>/app/billing/success?session_id={CHECKOUT_SESSION_ID}` (`wardrobe-backend` PR 92, `src/shared/billing-urls.ts`). That lands on `BillingSuccessPage`.
- When signed in, `external_id` is the SHA-256 hex of the Firebase uid (Web Crypto). Never the raw uid, email, phone, or name. Meta: `fbq('init', id, { external_id })` (re-init after login). TikTok: `ttq.identify({ external_id })`.

Page views send route templates such as `/app/wardrobes/:id`, never real IDs, emails, names, or search terms. Advanced matching is not used.

Subscribe fires only after a successful return to `/app/billing/success` once `GET /me` shows `paidTier`, never on the checkout click. InitiateCheckout fires when checkout is created. The website does not guess trial status from the plan or entitlement. If web trials are added later, the trial flag must come from the backend (for example a `conversionEvent` field) so browser and server event names stay matched.

## Store CTA click events

Enabled App Store and Google Play buttons (hero, download band, and share preview) send click events only. They do not send `page_view` / `PageView`.

| Vendor | Event name | How it is sent | Parameters |
| --- | --- | --- | --- |
| Google Analytics 4 | `store_cta_click` | `gtag('event', ...)` | `store`: `appStore` or `playStore`; `placement`: `hero`, `download`, or `share` |
| Meta Pixel | `StoreCtaClick` | `fbq('trackCustom', ...)` | `store`: `appStore` or `playStore`; `placement`: `hero`, `download`, or `share` |
| TikTok Pixel | `ClickButton` | `ttq.track(...)` | `store`: `appStore` or `playStore`; `placement`: `hero`, `download`, or `share` |

Disabled Google Play “coming soon” buttons do not send events. App Store buttons are live by default and do send events when a vendor ID is set.

## How to test pixels

1. Set `VITE_GA_MEASUREMENT_ID`, `VITE_META_PIXEL_ID`, and/or `VITE_TIKTOK_PIXEL_ID` in `.env.local` (or Netlify for a preview deploy).
2. Optionally set `VITE_TRACKING_DEBUG=true` and watch `[tracking]` in the browser console.
3. Meta: Events Manager → Test Events. Optionally set `VITE_META_TEST_EVENT_CODE` while testing; leave it blank in production.
4. TikTok: Events Manager → Test Events. Optionally set `VITE_TIKTOK_TEST_EVENT_CODE` while testing; leave it blank in production.
5. Confirm Subscribe `eventID` / `event_id` is `stripe_` plus the Stripe `session_id` query value, and that the raw session id is not in event params. After sign-in, confirm Meta `init` and TikTok `identify` carry only the hashed `external_id`.

Legal pages always refer to **the operator** (no personal names). Set `VITE_LEGAL_CONTACT_EMAIL` in Netlify so store reviewers have a visible contact address.

## Contact form

The Contact Us page (`/contact`) POSTs JSON to `{VITE_API_BASE_URL}/support/contact` with `Content-Type: application/json`. The request is unauthenticated: no `Authorization` header and no cookies (`credentials: "omit"`).

If `VITE_API_BASE_URL` is unset, the page still renders and the submit button stays disabled.

The backend must allowlist this site’s origin(s) via `SUPPORT_CONTACT_ALLOWED_ORIGINS`:

- Production public site origin (the same origin as `VITE_PUBLIC_SITE_URL`)
- Netlify deploy-preview origins, using the deploy-preview pattern (for example `https://deploy-preview-*--<site>.netlify.app`)

This frontend never calls an email provider. Delivery is owned by the backend.

## Billing plans

The Pricing page (`/pricing` and `/app/pricing`) GETs `{VITE_API_BASE_URL}/billing/plans` with no auth header and no cookies (`credentials: "omit"`). The response is `{ plans: [...] }` with live Stripe `unitAmount`, `currency`, `tier`, and `interval`. Prices are never hardcoded in the UI.

If `VITE_API_BASE_URL` is unset, or the API returns `503` `{ error: { code: "PLANS_UNAVAILABLE" } }`, the page shows a friendly unavailable state with Retry. This frontend never loads Stripe.js and never stores Stripe secrets.

## Firebase console setup

Use the same Firebase project as the mobile app so a user who signed up there signs in on the web with the same uid. These values are public web config only. Do not put Firebase Admin keys or other secrets in this repo or in Netlify as private server keys for the frontend.

- Enable the Google provider
- Enable the Apple provider (requires an Apple Services ID, Team ID, Key ID and private key configured in Firebase)
- Enable the Email/Password provider
- Add the Netlify site domain and any custom domain to Authentication > Settings > Authorized domains
- Set the `VITE_FIREBASE_*` env vars in Netlify

The landing header resolves auth lazily after mount so a signed-in visitor sees Dashboard instead of Log in and Sign up. Firebase stays out of the landing entry chunk. The SDK loads from a later async chunk when auth is resolved, and from the `/login` and `/app` route chunks.

## Authenticated API

Signed-in `/app` requests use `VITE_API_BASE_URL` with `Authorization: Bearer <Firebase ID token>`. The token comes from the same public Firebase web config used at `/login`. These are public client values; never put Admin keys, service-account files, or other secrets in Netlify frontend env vars.

If `VITE_API_BASE_URL` is unset, authenticated calls fail closed as misconfigured.

## Mock API

`VITE_USE_MOCK_API` is a public boolean (default `false`). `true` and `1` (any case, surrounding whitespace ignored) are treated as enabled; every other value, including blank or unset, is disabled.

Read it with `isMockApi()` from `src/config/mockApi.ts`. Keep the flag `false` in production. Live signed-in calls still go through `src/api` (`httpClient`, `authenticatedApi`, `useApi`) when the flag is off. Catalog reads and writes (`src/api/resourceApi.ts`) use that same client, including Virtual Profile nested writes and Virtual Try On `POST .../render`. Types for those responses live in `src/api/resourceTypes.ts` and match the WARDROBE-173 contract. Soft-gate Virtual Profiles and Virtual Try On from `GET /me` `features.aiTryOn`; use `features.otherAi` for other AI actions. The server still enforces access with `403`.

## Netlify notes

- Build command: `npm run build` (from `netlify.toml`)
- Publish directory: `dist`
- Node: `22`
- SPA redirects: `/*` → `/index.html` (`200`)
