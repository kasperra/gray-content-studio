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

**Fonts must be installed locally** or the render silently falls back to DejaVu
and looks wrong:

```bash
mkdir -p ~/.fonts && cd ~/.fonts
curl -sSL -o Archivo-400.ttf  "$(curl -s 'https://fonts.googleapis.com/css2?family=Archivo:wght@400' | grep -oE 'https://fonts.gstatic.com[^)]*')"
curl -sSL -o Archivo-800.ttf  "$(curl -s 'https://fonts.googleapis.com/css2?family=Archivo:wght@800' | grep -oE 'https://fonts.gstatic.com[^)]*')"
curl -sSL -o Hanken-400.ttf   "$(curl -s 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400' | grep -oE 'https://fonts.gstatic.com[^)]*')"
curl -sSL -o Hanken-600.ttf   "$(curl -s 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@600' | grep -oE 'https://fonts.gstatic.com[^)]*')"
fc-cache -f
```

Output is written twice: `png/` (lossless, for anything you edit further) and
`jpg/` (quality 92, progressive). **Instagram's Graph API documents JPEG-only
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
| `reel-before.png` | 1080×1920 | Title frame for before/after reels |
| `reel-after.png` | 1080×1920 | Title frame for before/after reels |

Carousel slides 2 and 4 mirror the `SOCIAL_LAYER` preset in
`src/modules/pricing/bundles.ts` (4 reels) and the Social Starter floor
($1,400/mo). If those change, update the copy here too.
