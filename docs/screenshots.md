# Screenshot assets

Marketing captures are not in the mobile app yet. This site ships **labeled SVG placeholders** for the six showcase slots.

## Slots

| Slot | Placeholder file | Drop-in PNG name |
| --- | --- | --- |
| Home | `public/screenshots/home.svg` | `public/screenshots/home.png` |
| Wardrobe detail | `public/screenshots/wardrobe-detail.svg` | `public/screenshots/wardrobe-detail.png` |
| Item detail | `public/screenshots/item-detail.svg` | `public/screenshots/item-detail.png` |
| Outfits | `public/screenshots/outfits.svg` | `public/screenshots/outfits.png` |
| Try-on | `public/screenshots/try-on.svg` | `public/screenshots/try-on.png` |
| Account | `public/screenshots/account.svg` | `public/screenshots/account.png` |

The gallery reads paths from `src/content/screenshotSlots.ts`.

## Drop-in path for real PNGs

1. Export portrait phone captures (about **1170×2532**, or another **9:19.5** frame) for each slot above. Crop chrome consistently.
2. Save the PNGs in `public/screenshots/` using the **exact filenames** in the table.
3. In `src/content/screenshotSlots.ts`, set `screenshotFormat` to `"png"`.
4. Keep `alt` text accurate to the real UI. Update slot `description` copy only if the capture changes the story.
5. Do not commit secrets, credentials, or unreleased personal data in screenshots.

Placeholder SVGs can remain in the folder. Only `screenshotFormat` controls which files the landing page loads.

## Local preview

After dropping PNGs and flipping `screenshotFormat`, run `npm run dev` and check **Home**, **Screenshots**, and the hero phone frame.
