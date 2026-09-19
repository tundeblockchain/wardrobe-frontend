# Environment variables

This app is a Vite SPA. Only variables prefixed with `VITE_` are available in the client bundle. Treat every `VITE_*` value as **public**.

Set values locally in `.env.local` (gitignored). For production, set the same keys in the **Netlify UI** (Site settings → Environment variables). The Netlify project owner configures the site; this repo only documents the names.

Never commit secrets, tokens, or private keys.

## Variables

| Name | Required | Purpose | Example placeholder |
| --- | --- | --- | --- |
| `VITE_APP_NAME` | No (defaults to `Digital Wardrobe`) | Display name in site chrome | `Digital Wardrobe` |
| `VITE_APP_STORE_URL` | No | Public App Store URL for landing download CTAs. Empty values render a disabled button. | `https://apps.apple.com/app/id000000000` |
| `VITE_PLAY_STORE_URL` | No | Public Play Store URL for landing download CTAs. Empty values render a disabled button. | `https://play.google.com/store/apps/details?id=com.example.wardrobe` |
| `VITE_PUBLIC_SITE_URL` | No | Public origin for canonical, Open Graph, and Twitter URLs (no trailing slash). When unset, the current origin is used in the browser. | `https://example.com` |
| `VITE_API_BASE_URL` | No | Public backend API origin (no trailing slash) for `GET /public/shares/{token}` on `/share/:token`. Empty values show a clear “couldn't load” state. | `https://api.example.com` |
| `VITE_GA_MEASUREMENT_ID` | No | Google Analytics 4 measurement ID. Scripts are injected only when this value is a `G-` ID. | `G-XXXXXXXXXX` |
| `VITE_META_PIXEL_ID` | No | Meta Pixel ID. The pixel is injected only when this value is a numeric ID. | `000000000000000` |
| `VITE_LEGAL_CONTACT_EMAIL` | No | Public operator contact email shown on Terms of Service and Privacy Policy. Empty values show a store-listing contact fallback. | `legal@example.com` |
| `VITE_LEGAL_CONTACT_URL` | No | Optional public operator contact page shown on Terms of Service and Privacy Policy. | `https://example.com/contact` |

Empty or whitespace-only values are treated as unset by `getPublicAppEnv()`.

Google Analytics and Meta Pixel snippets are omitted entirely when their IDs are missing, blank, or not a valid public identifier. Do not put real measurement IDs in the repository.

## Store CTA click events

Enabled App Store and Google Play buttons (hero, download band, and share preview) send click events only. They do not send `page_view` / `PageView`.

| Vendor | Event name | How it is sent | Parameters |
| --- | --- | --- | --- |
| Google Analytics 4 | `store_cta_click` | `gtag('event', ...)` | `store`: `appStore` or `playStore`; `placement`: `hero`, `download`, or `share` |
| Meta Pixel | `StoreCtaClick` | `fbq('trackCustom', ...)` | `store`: `appStore` or `playStore`; `placement`: `hero`, `download`, or `share` |

A vendor is called only when its env ID is a valid public identifier **and** that vendor’s function (`gtag` or `fbq`) is present. Empty, blank, or malformed IDs are a no-op. Disabled “coming soon” buttons do not send events.

Legal pages always refer to **the operator** (no personal names). Set `VITE_LEGAL_CONTACT_EMAIL` in Netlify so store reviewers have a visible contact address.

## Netlify notes

- Build command: `npm run build` (from `netlify.toml`)
- Publish directory: `dist`
- Node: `22`
- SPA redirects: `/*` → `/index.html` (`200`)
