# Social assets

On-brand social graphics rendered to PNG at exact platform dimensions. Design
tokens mirror `src/app/globals.css` — Tuscan Sun `#fac748`, Rich Mahogany
`#301509`, near-black `#0b0b0c`, Archivo display + Hanken Grotesk body.

## Regenerating

```bash
python3 social-assets/build.py
```

Output lands in `social-assets/png/`. Edit the `ASSETS` dict at the bottom of
`build.py` to change copy, then re-run — the layout functions handle sizing.

## Requirements

**Chromium** — the script finds a Playwright headless build automatically on
macOS or Linux, newest first. Override with `CHROME_BIN=/path/to/binary`, or
install one with `npx playwright install chromium`.

**Fonts are vendored**, not installed system-wide:

```bash
python3 social-assets/build.py --fonts
```

That caches Archivo + Hanken Grotesk (all subsets) into `social-assets/.fonts/`
and the render references them directly. The cache is gitignored, so run it once
in a fresh clone. Skipping it prints a warning and the render falls back to a
system font — it no longer does so silently.

Output is written twice: `png/` (lossless, for anything you edit further) and
`jpg/` (quality 92, progressive). **Both directories are gitignored** — they are
build output, so regenerate rather than expecting them in a fresh clone. The
copies under `public/img/social/` *are* tracked, because Vercel serves those for
Meta's fetchers to pull when publishing. **Instagram's Graph API documents JPEG-only
source URLs**, so the JPEG mirror is what gets published. Requires Pillow:

```bash
pip install Pillow
```

Do not reach for the ffmpeg bundled with Playwright to do this conversion — that
build ships a PNG *encoder* but no PNG *decoder*, so it rejects the very files
this script produces.

## Instagram aspect ratio

Instagram assets are **1080×1350 (4:5)**, not square. The profile grid crops 1:1
posts to 4:5, trimming 108px off each side — which clipped the left-aligned type
on the first version of these. Native 4:5 renders uncropped in both the feed and
the grid, and occupies more vertical space in-feed.

## Renderer gotcha

`build.py` uses `headless_shell`, **not** `chrome --headless=new`. The latter
reserves ~82px of window chrome, so the page lays out in a shorter viewport
while the screenshot still captures the full window height — silently clipping
the bottom row of every asset. If you switch binaries, verify the footer
wordmark is visible before shipping anything.

## The batch

| File | Size | Use |
|---|---|---|
| `ig-credentials.png` | 1080×1350 | Instagram anchor post — square cut of the credentials card |
| `ig-carousel-1..5.png` | 1080×1350 | Instagram carousel — sells the monthly bundle |
| `yt-cost.png` | 1280×720 | Thumbnail for the video-production-cost post |
| `yt-brandfilm.png` | 1280×720 | Thumbnail for the brand-film post |
| `yt-shortform.png` | 1280×720 | Thumbnail for the short-form-strategy post |
| `fb-credentials.png` | 1200×630 | Facebook / OG card — Fortune 500 credibility play |
| `ad-fall-1x1.png` | 1080×1080 | Paid FB/IG ad — square |
| `ad-fall-4x5.png` | 1080×1350 | Paid FB/IG ad — 4:5, most feed real estate |
| `post-fall-mini.png` | 1080×1350 | Fall Mini Sessions — the offer and what's included |
| `post-fall-book.png` | 1080×1350 | Fall Mini Sessions — booking call to action |
| `post-event-coverage.png` | 1080×1350 | Event coverage — Event Essentials tier |
| `reel-before.png` | 1080×1920 | Title frame for before/after reels |
| `reel-after.png` | 1080×1920 | Title frame for before/after reels |

The `ad-fall-*` creatives read price, title and the spec row out of
`campaigns.ts` at build time rather than repeating them, so a paid ad can't
drift from the page it points at — re-run the build after changing the offer.
They are 1:1 and 4:5 only: the 1.91:1 link-ad ratio takes the least vertical
space in feed and loses 71% of its width when a placement crops to 9:16.

`post-fall-mini` and `post-fall-book` mirror the campaign in
`src/modules/campaigns/campaigns.ts`, and `post-event-coverage` mirrors
`EVENT_PACKAGES[0]` in `src/content/site.ts` — both are prices on a public
page, so change them here when those change.

Carousel slides 2 and 4 mirror the `SOCIAL_LAYER` preset in
`src/modules/pricing/bundles.ts` (4 reels) and the Social Starter floor
($1,400/mo). If those change, update the copy here too.
