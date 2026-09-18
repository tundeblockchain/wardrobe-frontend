# wardrobe-frontend

Public web app for the Digital Wardrobe product. This repository currently ships the **WARDROBE-105** scaffold: React + TypeScript + Vite + Material UI, with lint, unit tests, GitHub Actions CI, and Netlify deploy config.

Landing page content, legal pages, and analytics pixels are intentionally out of scope here (follow-on tickets).

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

Required and optional public env vars (store URLs, GA, Meta Pixel IDs) are listed in [docs/environment.md](docs/environment.md) and `.env.example`. Values must use the `VITE_` prefix. Never put private keys in this repo.

## CI

Pull requests run GitHub Actions jobs named **lint**, **build**, and **test** (see `.github/workflows/ci.yml`). Mark **lint** and **build** as required checks in GitHub when ready.

## Netlify

`netlify.toml` is SPA-ready (`npm run build`, publish `dist`, redirect `/*` → `/index.html`). The Netlify project owner configures the site; set env vars in the Netlify UI using the names in [docs/environment.md](docs/environment.md).
