# wardrobe-frontend

Public web app for the Pocket Closet product. React + TypeScript + Vite + Material UI, with lint, unit tests, GitHub Actions CI, and Netlify deploy config.

The public landing page includes a hero, feature sections, a labeled screenshot showcase, and App Store / Play Store CTAs. The App Store URL defaults to the live listing; Play Store CTAs stay disabled until `VITE_PLAY_STORE_URL` is set.

Public share links use `/share/:token`. That page is read-only: it loads a title, optional image, and ITEM/OUTFIT type from `GET {VITE_API_BASE_URL}/public/shares/{token}` (no auth), then shows the same store CTAs. Missing, expired, or failed previews have clear empty states.

The public marketing site (`/`, `/terms`, `/privacy`, `/contact`, `/pricing`, `/share/:token`) is separate from the signed-in web app at `/app/*`. `/pricing` is a public Pricing page with Free, Basic, and Premium. Paid prices come only from unauthenticated `GET {VITE_API_BASE_URL}/billing/plans`. Signed-out Upgrade sends people to sign in or sign up with `next=/pricing`. Signed-in users can also open the same page at `/app/pricing` inside the dashboard paper. `/login` signs in with Firebase Auth (Google, Apple, and email/password) on the same project as the mobile app. `/login?mode=signup` opens the create-account view. Signed-in `/app/*` routes use a dashboard shell (collapsible sidebar, account menu) instead of the landing header and footer. Signed-in catalog views list wardrobes (`/app/wardrobes`), a wardrobe and its clothing items (`/app/wardrobes/:id`), a clothing item (`/app/items/:id`), outfits (`/app/outfits`), Virtual Profiles (`/app/virtual-profiles`), and Virtual Try On (`/app/virtual-try-on`). Virtual Profiles can be created, edited, and deleted. Virtual Try On starts a render from a Virtual Profile plus clothing items or an outfit, then shows the render result on the page. Those pages use the authenticated API client from `src/api` (`httpClient`, `authenticatedApi`, `useApi`) and switch to the mock implementation when `VITE_USE_MOCK_API` is `true` or `1`. `/me` `features.aiTryOn` shows the Virtual Profiles and Virtual Try On pages; `features.otherAi` gates other AI writes. If a feature is off, or the server returns `403`, the page shows an upgrade prompt (catalog limit codes → Basic, `ENTITLEMENT_AI_REQUIRED` → Premium). Images are displayed from the HTTPS URLs the API returns with a plain `img` tag. The landing header and mobile menu show Log in and Sign up, or Dashboard when a session is already present. Firebase stays out of the landing entry chunk; the SDK loads lazily after mount when auth state is resolved, and on `/login` and `/app`.

Terms of Service (`/terms`) and Privacy Policy (`/privacy`) are linked from the header and footer. Operator contact on those pages is env-driven (`VITE_LEGAL_CONTACT_EMAIL`, optional `VITE_LEGAL_CONTACT_URL`). Copy refers to the operator only — no personal names.

Contact Us (`/contact`) is a public form that POSTs to `{VITE_API_BASE_URL}/support/contact` with no auth header and no cookies. If that env var is unset, the page still renders and submit stays disabled. The backend must allowlist this site’s origin(s) via `SUPPORT_CONTACT_ALLOWED_ORIGINS` (production plus the Netlify deploy-preview pattern).

The landing and legal pages ship semantic markup, Open Graph / Twitter tags, and JSON-LD (`SoftwareApplication` / `WebPage`). Optional Google Analytics (`VITE_GA_MEASUREMENT_ID`) and Meta Pixel (`VITE_META_PIXEL_ID`) inject only when those public IDs are set. Store CTA clicks then send `store_cta_click` (GA) and `StoreCtaClick` (Meta custom event); see [docs/environment.md](docs/environment.md).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run build` | Typecheck and production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest (single run) |
| `npm run test:watch` | Vitest watch mode |
| `npm run screenshots` | Resize/compress iOS captures into `public/screenshots/` (dev only; needs raw PNGs + `sharp`) |

## Local setup

1. Use Node.js 22+ (see `.nvmrc`).
2. `npm ci`
3. Copy `.env.example` to `.env.local` and fill placeholders as needed. **Do not commit secrets.**
4. `npm run dev`

## Environment variables

Required and optional public env vars (store URLs, backend API origin, legal contact, GA, Meta Pixel IDs, Firebase web config) are listed in [docs/environment.md](docs/environment.md) and `.env.example`. Values must use the `VITE_` prefix. Never put private keys or Firebase Admin credentials in this repo.

## Firebase console setup

Use the same Firebase project as the mobile app so web and mobile share the same uid.

- Enable the Google provider
- Enable the Apple provider (requires an Apple Services ID, Team ID, Key ID and private key configured in Firebase)
- Enable the Email/Password provider
- Add the Netlify site domain and any custom domain to Authentication > Settings > Authorized domains
- Set the `VITE_FIREBASE_*` env vars in Netlify

Landing and share-preview CTAs read `VITE_APP_STORE_URL` and `VITE_PLAY_STORE_URL`. `VITE_APP_STORE_URL` defaults to `https://apps.apple.com/gb/app/my-pocket-closet/id6809181010` when unset or blank. A Netlify value overrides that default, so if the key is already set there it must be updated to the live URL. Leave `VITE_PLAY_STORE_URL` blank to keep the Google Play button disabled.

Set `VITE_API_BASE_URL` to the public backend origin (for example `https://api.example.com`, no trailing slash) so `/share/:token` can fetch `GET /public/shares/{token}`, `/contact` can POST `/support/contact`, and `/pricing` can fetch `GET /billing/plans`. Leave it blank to show a clear unavailable state on those pages.

Set `VITE_PUBLIC_SITE_URL` to the public origin (for example `https://example.com`) so canonical and social URLs are absolute. Leave `VITE_GA_MEASUREMENT_ID` and `VITE_META_PIXEL_ID` blank to ship no analytics or advertising scripts.

## Screenshots

The landing page shows six real iOS captures inside a reusable iPhone frame (`src/components/device/IPhoneFrame.tsx`): Virtual Try On (hero), ivory maxi, blue mini, Home, Item detail, and Add item. Browsers pick AVIF / WebP / JPEG from a `srcset`. To regenerate the committed derivatives from raw captures, follow [docs/screenshots.md](docs/screenshots.md). Do not commit the original multi-megabyte PNGs.

## CI

Pull requests run GitHub Actions jobs named **lint**, **build**, and **test** (see `.github/workflows/ci.yml`). Mark **lint** and **build** as required checks in GitHub when ready.

## Netlify

`netlify.toml` is SPA-ready (`npm run build`, publish `dist`, redirect `/*` → `/index.html`). Configure the Netlify site in the project dashboard; set env vars in the Netlify UI using the names in [docs/environment.md](docs/environment.md).
