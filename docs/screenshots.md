# Screenshot assets

The landing page ships **optimized iOS captures** for six showcase slots. Each slot is rendered inside the reusable `IPhoneFrame` (`src/components/device/IPhoneFrame.tsx`) — a CSS-only bezel with a Dynamic Island, used for the hero phone, the thumbs under the store CTAs, and the showcase gallery.

Raw multi-megabyte PNGs are **not** committed. Only the resized AVIF / WebP / JPEG derivatives under `public/screenshots/` (plus `public/og-image.jpg`) are in git.

## Slots

| Slot | Label | Default files |
| --- | --- | --- |
| Virtual Try On (hero) | Virtual Try On | `public/screenshots/try-on-rust-floral-{390,780,1170}.{avif,webp,jpg}` |
| Ivory maxi | Ivory maxi | `public/screenshots/try-on-ivory-maxi-{390,780,1170}.{avif,webp,jpg}` |
| Blue mini | Blue mini | `public/screenshots/try-on-blue-mini-{390,780,1170}.{avif,webp,jpg}` |
| Home | Home | `public/screenshots/home-{390,780,1170}.{avif,webp,jpg}` |
| Item detail | Item detail | `public/screenshots/item-detail-{390,780,1170}.{avif,webp,jpg}` |
| Add item | Add item | `public/screenshots/add-item-{390,780,1170}.{avif,webp,jpg}` |

The gallery, hero phone, and CTA thumbs read paths from `src/content/screenshotSlots.ts`. The large hero phone uses the rust floral Virtual Try On slot; the smaller thumbs reuse the remaining five.

`<picture>` + `srcset` / `sizes` serve AVIF, then WebP, then JPEG. Hero-size files stay well under 250 KB; thumbs use the 390-wide derivative. The Open Graph image is `public/og-image.jpg` (a 1200×630 crop of the hero Virtual Try On look).

## Regenerating derivatives

This is a **dev-only** step. GitHub Actions CI does not run it and does not need the raw PNGs.

1. Put the six portrait captures (about **1170×2532**, or another **9:19.5** frame) in `screenshots-source/` (gitignored) using names that start with:

   - `01-tryon-rust-floral.png`
   - `02-tryon-ivory-maxi.png`
   - `03-tryon-blue-mini.png`
   - `04-item-detail-plum.png`
   - `05-home.png`
   - `06-add-item.png`

   Hashed suffixes (for example `01-tryon-rust-floral_34c4.png`) are fine.

2. Install dependencies (`npm ci`) so the `sharp` devDependency is available.

3. Run:

   ```bash
   npm run screenshots
   ```

   Or point at another folder:

   ```bash
   SCREENSHOT_SOURCE_DIR=/path/to/raw-pngs npm run screenshots
   # or
   node scripts/generate-screenshots.mjs --source /path/to/raw-pngs
   ```

4. The script writes AVIF, WebP, and JPEG at 390 / 780 / 1170 px wide into `public/screenshots/`, plus `public/og-image.jpg`. Commit those derivatives only.

5. Keep `alt` text in `src/content/screenshotSlots.ts` accurate to the real UI. Use the product name **Virtual Try On** (title case) in labels and descriptions. Do not commit secrets, credentials, or unreleased personal data.

## Local preview

After regenerating assets, run `npm run dev` and check the hero phone, the thumbs under the store CTAs, and the **See the app** showcase.
