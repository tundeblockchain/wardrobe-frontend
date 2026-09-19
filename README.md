# wardrobe-frontend

Public web app for the Digital Wardrobe product. React + TypeScript + Vite + Material UI, with lint, unit tests, GitHub Actions CI, and Netlify deploy config.

The public landing page includes a hero, feature sections, a labeled screenshot showcase, and App Store / Play Store CTAs. Store URLs are env-driven and stay disabled until set.

Terms of Service (`/terms`) and Privacy Policy (`/privacy`) are linked from the header and footer. Operator contact on those pages is env-driven (`VITE_LEGAL_CONTACT_EMAIL`, optional `VITE_LEGAL_CONTACT_URL`). Copy refers to the operator only — no personal names.

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

## Local setup

1. Use Node.js 22+ (see `.nvmrc`).
2. `npm ci`
3. Copy `.env.example` to `.env.local` and fill placeholders as needed. **Do not commit secrets.**
4. `npm run dev`

## Environment variables

Required and optional public env vars (store URLs, legal contact, GA, Meta Pixel IDs) are listed in [docs/environment.md](docs/environment.md) and `.env.example`. Values must use the `VITE_` prefix. Never put private keys in this repo.

Landing CTAs read `VITE_APP_STORE_URL` and `VITE_PLAY_STORE_URL`. Leave them blank to render disabled “coming soon” buttons.

Set `VITE_PUBLIC_SITE_URL` to the public origin (for example `https://example.com`) so canonical and social URLs are absolute. Leave `VITE_GA_MEASUREMENT_ID` and `VITE_META_PIXEL_ID` blank to ship no analytics or advertising scripts.

## Screenshot placeholders

The showcase ships labeled SVG placeholders (Home, Wardrobe detail, Item detail, Outfits, Try-on, Account). To drop in real PNGs later, follow [docs/screenshots.md](docs/screenshots.md).

## CI

Pull requests run GitHub Actions jobs named **lint**, **build**, and **test** (see `.github/workflows/ci.yml`). Mark **lint** and **build** as required checks in GitHub when ready.

## Netlify

`netlify.toml` is SPA-ready (`npm run build`, publish `dist`, redirect `/*` → `/index.html`). Configure the Netlify site in the project dashboard; set env vars in the Netlify UI using the names in [docs/environment.md](docs/environment.md).
