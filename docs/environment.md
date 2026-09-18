# Environment variables

This app is a Vite SPA. Only variables prefixed with `VITE_` are available in the client bundle. Treat every `VITE_*` value as **public**.

Set values locally in `.env.local` (gitignored). For production, set the same keys in the **Netlify UI** (Site settings → Environment variables). The Netlify project owner configures the site; this repo only documents the names.

Never commit secrets, tokens, or private keys.

## Variables

| Name | Required | Purpose | Example placeholder |
| --- | --- | --- | --- |
| `VITE_APP_NAME` | No (defaults to `Digital Wardrobe`) | Display name in site chrome | `Digital Wardrobe` |
| `VITE_APP_STORE_URL` | No | Public App Store URL for a follow-on landing CTA | `https://apps.apple.com/app/id000000000` |
| `VITE_PLAY_STORE_URL` | No | Public Play Store URL for a follow-on landing CTA | `https://play.google.com/store/apps/details?id=com.example.wardrobe` |
| `VITE_GA_MEASUREMENT_ID` | No | Google Analytics 4 measurement ID. Pixel wiring is a follow-on ticket. | `G-XXXXXXXXXX` |
| `VITE_META_PIXEL_ID` | No | Meta Pixel ID. Pixel wiring is a follow-on ticket. | `000000000000000` |

Empty or whitespace-only values are treated as unset by `getPublicAppEnv()`.

## Netlify notes

- Build command: `npm run build` (from `netlify.toml`)
- Publish directory: `dist`
- Node: `22`
- SPA redirects: `/*` → `/index.html` (`200`)
