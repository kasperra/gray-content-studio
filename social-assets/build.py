#!/usr/bin/env python3
"""Renders Gray Content Studio social assets to PNG at exact platform dimensions.

Design tokens are read from the same values as src/app/globals.css so the assets
stay in sync with the site. Re-run after editing COPY below:

    python3 social-assets/build.py

Requires Chromium (already at /opt/pw-browsers/chromium) and the Archivo +
Hanken Grotesk fonts installed locally (see README in this folder).
"""

# Annotations stay lazy so `Path | None` parses on macOS's system Python 3.9,
# which is what `python3` resolves to there. Without it the script dies at
# import with a TypeError that says nothing about versions.
from __future__ import annotations

import subprocess
import shutil
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / "png"
JPG = HERE / "jpg"
TMP = HERE / ".html"
FONTS = HERE / ".fonts"


def find_chrome() -> str:
    """Locate a headless Chromium.

    The hardcoded Linux path this used to carry meant the script only ran on the
    box it was written on; everywhere else it produced no output and a wall of
    empty stderr. Checks CHROME_BIN first, then the Playwright caches on Linux
    and macOS, newest build first.
    """
    import os, glob
    if os.environ.get("CHROME_BIN"):
        return os.environ["CHROME_BIN"]
    # The binary's name and its parent directory both vary by platform and
    # build: headless_shell on Linux, chrome-headless-shell on macOS.
    caches = [
        "/opt/pw-browsers",
        str(Path.home() / "Library/Caches/ms-playwright"),
        str(Path.home() / ".cache/ms-playwright"),
    ]
    leaves = [
        "chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell",
        "chromium_headless_shell-*/chrome-linux/headless_shell",
        "chromium-*/chrome-linux/chrome",
        "chromium-*/chrome-mac*/Chromium.app/Contents/MacOS/Chromium",
    ]
    patterns = [f"{c}/{l}" for c in caches for l in leaves]
    for pat in patterns:
        hits = sorted(glob.glob(pat), reverse=True)
        if hits:
            return hits[0]
    raise SystemExit(
        "No headless Chromium found. Install one with `npx playwright install "
        "chromium`, or point CHROME_BIN at a binary."
    )


CHROME = find_chrome()

# --- tokens: mirror of src/app/globals.css @theme -------------------------
BG = "#0b0b0c"
SURFACE = "#141416"
INK = "#f5f2ec"
MUTED = "#9b968e"
ACCENT = "#fac748"       # Tuscan Sun
MAHOGANY = "#301509"     # Rich Mahogany
RULE = "rgba(245,242,236,0.12)"

def font_css() -> str:
    """Local @font-face declarations, or "" when the cache is missing.

    The README used to ask you to install Archivo and Hanken Grotesk as system
    fonts, and warned that a render silently falls back to DejaVu and "looks
    wrong" otherwise — a footgun that costs you a whole batch before you notice.
    Vendoring them next to the script removes the manual step and the failure
    mode. `python3 social-assets/build.py --fonts` refreshes the cache.
    """
    css = FONTS / "fonts.css"
    if not css.exists():
        print("  ! no font cache — run: python3 social-assets/build.py --fonts")
        return ""
    # Paths inside the css are relative to the cache dir, so the page has to
    # resolve from there; the HTML is written elsewhere, hence the absolute base.
    return css.read_text().replace("url(", f"url({FONTS.resolve().as_uri()}/")


BASE = f"""
  {font_css()}
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  html,body {{ background:{BG}; color:{INK};
    font-family:'Hanken Grotesk',sans-serif; -webkit-font-smoothing:antialiased; }}
  .frame {{ position:relative; overflow:hidden; background:{BG};
    display:flex; flex-direction:column; }}
  /* mahogany depth glow — the 'cinematic' ground */
  .frame::before {{ content:''; position:absolute; inset:0;
    background:radial-gradient(120% 90% at 15% 0%, {MAHOGANY}bb 0%, transparent 55%),
               radial-gradient(80% 60% at 100% 100%, rgba(250,199,72,.10) 0%, transparent 60%);
    pointer-events:none; }}
  .inner {{ position:relative; z-index:1; display:flex; flex-direction:column;
    height:100%; width:100%; }}
  .display {{ font-family:'Archivo',sans-serif; font-weight:800;
    letter-spacing:-.03em; line-height:.94; }}
  .eyebrow {{ color:{ACCENT}; font-weight:600; text-transform:uppercase; }}
  .rule {{ height:1px; background:{RULE}; width:100%; }}
  .muted {{ color:{MUTED}; }}
  .accent {{ color:{ACCENT}; }}
  .wordmark {{ font-family:'Archivo',sans-serif; font-weight:700;
    letter-spacing:.16em; text-transform:uppercase; color:{INK}; opacity:.72; }}
"""


def page(w: int, h: int, css: str, body: str) -> str:
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
{BASE}
.frame {{ width:{w}px; height:{h}px; }}
{css}
</style></head><body><div class="frame"><div class="inner">{body}</div></div></body></html>"""


# =========================================================================
# COPY — edit here, then re-run
# =========================================================================

SQ = 1080   # Instagram width
# Instagram crops 1:1 posts to 4:5 in the profile grid, trimming 108px from
# each side and eating into left-aligned type. Build native 4:5 instead.
IG_W, IG_H = 1080, 1350


def carousel_slide(n, total, eyebrow, headline, sub, big=None, big_label=None,
                   footer=None):
    """Instagram carousel slide, 1080x1350 (4:5). Grid: header / body / footer."""
    if big:
        lab = f'<div class="biglab">{big_label}</div>' if big_label else ""
        body = (f'<div class="bigwrap"><div class="bignum display accent">{big}</div>'
                f'{lab}</div>')
    else:
        body = f'<h1 class="headline display">{headline}</h1>'
        if sub:
            body += f'<p class="sub muted">{sub}</p>'
    if big and sub:
        body += f'<p class="sub muted">{sub}</p>'
    foot = footer or "graycontentstudio.co"
    hsize = 100 if len(headline) < 30 else (86 if len(headline) < 42 else 74)
    return page(IG_W, IG_H, f"""
      .grid {{ height:100%; padding:96px; display:grid;
        grid-template-rows:auto 1fr auto; }}
      .eyebrow {{ font-size:24px; letter-spacing:.22em; }}
      .body {{ display:flex; flex-direction:column; justify-content:center;
        min-height:0; }}
      .headline {{ font-size:{hsize}px; max-width:15ch; }}
      .bigwrap {{ display:flex; align-items:baseline; gap:34px; flex-wrap:wrap; }}
      .bignum {{ font-size:268px; line-height:.78; }}
      .biglab {{ font-family:'Archivo',sans-serif; font-weight:800; font-size:76px;
        letter-spacing:-.03em; line-height:.98; max-width:9ch; }}
      .sub {{ font-size:32px; line-height:1.44; margin-top:36px; max-width:25ch; }}
      .foot {{ display:flex; justify-content:space-between; align-items:center; }}
      .rule {{ margin-bottom:30px; }}
      .wordmark {{ font-size:19px; }}
      .count {{ font-family:'Archivo',sans-serif; font-weight:700; font-size:19px;
        color:{MUTED}; letter-spacing:.12em; }}
    """, f"""
      <div class="grid">
        <div class="eyebrow">{eyebrow}</div>
        <div class="body">{body}</div>
        <div>
          <div class="rule"></div>
          <div class="foot">
            <span class="wordmark">{foot}</span>
            <span class="count">{n} / {total}</span>
          </div>
        </div>
      </div>
    """)


def yt_thumb(kicker, line1, line2, stat=None):
    """YouTube thumbnail, 1280x720. Big type, readable at 210px wide."""
    stat_html = (
        f'<div class="stat"><span class="statnum display accent">{stat[0]}</span>'
        f'<span class="statlab muted">{stat[1]}</span></div>' if stat else ""
    )
    return page(1280, 720, f"""
      .grid {{ height:100%; padding:56px 80px 48px 80px; display:grid;
        grid-template-rows:auto 1fr auto; }}
      .kicker {{ font-size:22px; letter-spacing:.24em; }}
      .body {{ display:flex; flex-direction:column; justify-content:center;
        min-height:0; }}
      .l1 {{ font-size:100px; }}
      .l2 {{ font-size:100px; }}
      .stat {{ display:flex; align-items:baseline; gap:20px; margin-top:30px; }}
      .statnum {{ font-size:78px; }}
      .statlab {{ font-size:27px; }}
      .bar {{ position:absolute; left:0; top:0; bottom:0; width:12px;
        background:{ACCENT}; z-index:2; }}
      .wordmark {{ font-size:18px; text-align:right; }}
    """, f"""
      <div class="bar"></div>
      <div class="grid">
        <div class="kicker eyebrow">{kicker}</div>
        <div class="body">
          <h1 class="l1 display">{line1}</h1>
          <h1 class="l2 display accent">{line2}</h1>
          {stat_html}
        </div>
        <div class="wordmark">graycontentstudio.co</div>
      </div>
    """)


def fb_card(eyebrow, headline, sub, logos):
    """Facebook / OG link card, 1200x630."""
    chips = "".join(f'<span class="chip">{l}</span>' for l in logos)
    return page(1200, 630, f"""
      .grid {{ height:100%; padding:52px 72px 44px 72px; display:grid;
        grid-template-rows:auto 1fr auto; }}
      .eyebrow {{ font-size:19px; letter-spacing:.24em; }}
      .body {{ display:flex; flex-direction:column; justify-content:center;
        min-height:0; }}
      .headline {{ font-size:68px; max-width:19ch; }}
      .sub {{ font-size:25px; color:{MUTED}; margin-top:20px; max-width:46ch;
        line-height:1.45; }}
      .chips {{ display:flex; flex-wrap:wrap; gap:11px; }}
      .chip {{ border:1px solid {RULE}; border-radius:999px; padding:10px 20px;
        font-size:18px; color:{INK}; opacity:.86; }}
      .botrow {{ display:flex; justify-content:space-between; align-items:flex-end;
        gap:24px; }}
      .wordmark {{ font-size:17px; white-space:nowrap; }}
    """, f"""
      <div class="grid">
        <div class="eyebrow">{eyebrow}</div>
        <div class="body">
          <h1 class="headline display">{headline}</h1>
          <p class="sub">{sub}</p>
        </div>
        <div class="botrow">
          <div class="chips">{chips}</div>
          <div class="wordmark">graycontentstudio.co</div>
        </div>
      </div>
    """)


def square_credentials(eyebrow, headline, sub, logos):
    """4:5 anchor card for Instagram, 1080x1350. Same argument as fb_card; the
    taller canvas lets the client chips breathe."""
    chips = "".join(f'<span class="chip">{l}</span>' for l in logos)
    return page(IG_W, IG_H, f"""
      .grid {{ height:100%; padding:96px; display:grid;
        grid-template-rows:auto 1fr auto; }}
      .eyebrow {{ font-size:24px; letter-spacing:.22em; }}
      .body {{ display:flex; flex-direction:column; justify-content:center;
        min-height:0; }}
      .headline {{ font-size:86px; max-width:14ch; }}
      .sub {{ font-size:30px; color:{MUTED}; margin-top:32px; max-width:27ch;
        line-height:1.45; }}
      .chips {{ display:flex; flex-wrap:wrap; gap:12px; max-width:100%; }}
      .chip {{ border:1px solid {RULE}; border-radius:999px; padding:11px 22px;
        font-size:20px; color:{INK}; opacity:.86; }}
      .rule {{ margin:0 0 28px 0; }}
      .wordmark {{ font-size:19px; padding-top:26px; }}
    """, f"""
      <div class="grid">
        <div class="eyebrow">{eyebrow}</div>
        <div class="body">
          <h1 class="headline display">{headline}</h1>
          <p class="sub">{sub}</p>
        </div>
        <div>
          <div class="rule"></div>
          <div class="chips">{chips}</div>
          <div class="wordmark">graycontentstudio.co</div>
        </div>
      </div>
    """)


def reel_frame(label, headline, sub, w=1080, h=1920):
    """Vertical reel title/cover frame. Default 1080x1920 (9:16) for
    Stories/Reels; pass h=1350 for the 4:5 feed variant — feed posts crop 9:16
    to 4:5, which cuts the wordmark."""
    return page(w, h, f"""
      .grid {{ height:100%; padding:150px 88px 130px 88px; display:grid;
        grid-template-rows:1fr auto; }}
      .body {{ display:flex; flex-direction:column; justify-content:center;
        align-items:flex-start; min-height:0; }}
      .tag {{ background:{ACCENT}; color:{BG};
        font-family:'Archivo',sans-serif; font-weight:800;
        font-size:38px; letter-spacing:.14em; padding:18px 36px; }}
      .headline {{ font-size:116px; margin-top:56px; max-width:11ch; }}
      .sub {{ font-size:37px; color:{MUTED}; margin-top:44px; max-width:21ch;
        line-height:1.4; }}
      .wordmark {{ font-size:22px; }}
    """, f"""
      <div class="grid">
        <div class="body">
          <span class="tag">{label}</span>
          <h1 class="headline display">{headline}</h1>
          <p class="sub">{sub}</p>
        </div>
        <div class="wordmark">graycontentstudio.co</div>
      </div>
    """)


def campaign_facts(slug="fall-mini-sessions"):
    """Read the live campaign's price, title and highlights out of
    src/modules/campaigns/campaigns.ts.

    Parsed rather than retyped so an ad can't quietly drift from the page it
    sends people to — the price on a paid creative disagreeing with the landing
    page is the one error here that costs money. Raises instead of guessing: a
    silently stale price would be worse than a failed build.
    """
    import re
    src = (HERE.parent / "src/modules/campaigns/campaigns.ts").read_text()
    block = re.search(
        r'slug:\s*"%s".*?(?=\n};)' % re.escape(slug), src, re.S
    )
    if not block:
        raise SystemExit(f"campaign {slug!r} not found in campaigns.ts")
    b = block.group(0)

    def field(name):
        m = re.search(r'\n  %s:\s*"([^"]+)"' % name, b)
        if not m:
            raise SystemExit(f"campaign {slug!r}: no {name}")
        return m.group(1)

    hl = re.search(r"highlights:\s*\[(.*?)\]", b, re.S)
    highlights = re.findall(
        r'\{\s*label:\s*"([^"]+)",\s*value:\s*"([^"]+)"\s*\}', hl.group(1) if hl else ""
    )
    if not highlights:
        raise SystemExit(f"campaign {slug!r}: no highlights")

    return {
        "title": field("title"),
        "price": field("price"),
        "highlights": highlights,
    }


def photo_ad(photo, eyebrow, title, price, highlights, scarcity, url, w, h,
             focal="center"):
    """Photo-led paid creative, square or 4:5.

    Split rather than full-bleed-with-scrim. The first attempt ran the type over
    the photograph and it landed across a father's chest in the square and over
    a baby in the 4:5 — these frames put their subjects dead centre, so any
    bottom-anchored type block collides with a person. A scrim deep enough to
    fix that would have buried the faces it was there to show.

    So: photograph on top, untouched, and a solid brand panel beneath carrying
    every word. Nothing overlaps a face, contrast is a constant rather than a
    function of whatever is behind the text, and the panel is the same near-black
    the landing page opens on.
    """
    cells = "".join(
        f'<div class="spec"><div class="speclab">{l}</div>'
        f'<div class="specval">{v}</div></div>'
        for l, v in highlights
    )
    # The 4:5 has 270px more height at the same width; all of it goes to the
    # photograph, which is the thing being sold.
    photo_h = 856 if h > w else 586
    return page(w, h, f"""
      .frame {{ background:{BG}; }}
      .shot {{ position:relative; height:{photo_h}px; width:100%;
        background:{BG} url('{photo}') {focal}/cover no-repeat; }}
      /* Only enough darkening at the very top to hold the wordmark; the
         photograph is otherwise untouched. */
      .shot::after {{ content:''; position:absolute; inset:0 0 auto 0; height:210px;
        background:linear-gradient(to bottom, rgba(11,11,12,.82), rgba(11,11,12,.34) 62%,
          transparent); }}
      .top {{ position:absolute; top:52px; left:64px; right:64px; z-index:2;
        display:flex; justify-content:space-between; align-items:baseline; gap:24px; }}
      .wordmark {{ font-size:21px; opacity:1; }}
      .place {{ font-family:'Hanken Grotesk',sans-serif; font-size:19px;
        letter-spacing:.2em; text-transform:uppercase; color:{INK}; opacity:.95; }}
      .panel {{ height:calc(100% - {photo_h}px); padding:46px 64px 52px 64px;
        display:flex; flex-direction:column; justify-content:center; }}
      .eyebrow {{ font-size:23px; letter-spacing:.22em; }}
      /* One line by design — wrapping it pushes the spec row off the panel. */
      .headline {{ font-size:76px; margin-top:12px; white-space:nowrap; }}
      .pricerow {{ display:flex; align-items:baseline; gap:18px; margin-top:20px; }}
      .price {{ font-family:'Archivo',sans-serif; font-weight:800;
        letter-spacing:-.03em; font-size:86px; line-height:.9; color:{ACCENT}; }}
      .pricelab {{ font-size:27px; color:{INK}; opacity:.82; }}
      .specs {{ display:flex; gap:54px; margin-top:28px;
        border-top:1px solid rgba(245,242,236,.20); padding-top:22px; }}
      .speclab {{ font-family:'Hanken Grotesk',sans-serif; font-size:18px;
        letter-spacing:.18em; text-transform:uppercase; color:{MUTED}; }}
      /* Sized to survive the ~3x downscale of a phone feed — these are the
         differentiators and they were the first thing to go unreadable. */
      .specval {{ font-family:'Archivo',sans-serif; font-weight:700;
        font-size:38px; letter-spacing:-.01em; margin-top:5px; color:{INK}; }}
      .foot {{ display:flex; justify-content:space-between; align-items:center;
        gap:24px; margin-top:26px; border-top:1px solid rgba(245,242,236,.20);
        padding-top:22px; }}
      .scarcity {{ font-family:'Archivo',sans-serif; font-weight:700;
        font-size:22px; letter-spacing:.06em; text-transform:uppercase;
        color:{ACCENT}; }}
      .url {{ font-family:'Hanken Grotesk',sans-serif; font-size:21px;
        color:{INK}; opacity:.86; }}
    """, f"""
      <div class="shot">
        <div class="top">
          <span class="wordmark">Gray&middot;Content&middot;Studio</span>
          <span class="place">Richmond, VA</span>
        </div>
      </div>
      <div class="panel">
        <div class="eyebrow">{eyebrow}</div>
        <h1 class="headline display">{title}</h1>
        <div class="pricerow">
          <span class="price">{price}</span>
          <span class="pricelab">per session</span>
        </div>
        <div class="specs">{cells}</div>
        <div class="foot">
          <span class="scarcity">{scarcity}</span>
          <span class="url">{url}</span>
        </div>
      </div>
    """)


def offer_post(eyebrow, headline, price, price_label, bullets, footer=None,
               w=IG_W, h=IG_H):
    """Standalone 4:5 offer post, 1080x1350.

    carousel_slide would do most of this, but it always stamps an "n / total"
    counter in the footer, which is a lie on a single post. Same header/body/
    footer grid so the two formats sit together in a grid view.
    """
    items = "".join(f'<li>{b}</li>' for b in bullets)
    price_html = (
        f'<div class="pricewrap"><span class="price display accent">{price}</span>'
        f'<span class="pricelab muted">{price_label}</span></div>'
        if price else ""
    )
    hsize = 92 if len(headline) < 26 else (78 if len(headline) < 38 else 66)
    return page(w, h, f"""
      .grid {{ height:100%; padding:96px; display:grid;
        grid-template-rows:auto 1fr auto; }}
      .eyebrow {{ font-size:24px; letter-spacing:.22em; }}
      .body {{ display:flex; flex-direction:column; justify-content:center;
        min-height:0; }}
      .headline {{ font-size:{hsize}px; max-width:14ch; }}
      /* the display face has a .94 line-height, so a small margin here reads as
         a collision with the headline's descenders */
      .pricewrap {{ display:flex; align-items:baseline; gap:22px; margin-top:58px; }}
      .price {{ font-size:150px; line-height:.8; }}
      .pricelab {{ font-size:30px; }}
      ul {{ list-style:none; margin-top:44px; }}
      li {{ font-size:31px; line-height:1.34; color:{INK}; padding-left:44px;
        position:relative; margin-bottom:22px; }}
      /* the dot is the page's accent, sized off the cap height of the row */
      li::before {{ content:''; position:absolute; left:6px; top:.55em;
        width:13px; height:13px; border-radius:50%; background:{ACCENT}; }}
      .foot {{ display:flex; justify-content:space-between; align-items:center; }}
      .rule {{ margin-bottom:30px; }}
      .wordmark {{ font-size:19px; }}
      .cta {{ font-family:'Archivo',sans-serif; font-weight:700; font-size:19px;
        color:{ACCENT}; letter-spacing:.12em; text-transform:uppercase; }}
    """, f"""
      <div class="grid">
        <div class="eyebrow">{eyebrow}</div>
        <div class="body">
          <h1 class="headline display">{headline}</h1>
          {price_html}
          <ul>{items}</ul>
        </div>
        <div>
          <div class="rule"></div>
          <div class="foot">
            <span class="wordmark">graycontentstudio.co</span>
            <span class="cta">{footer or "Link in bio"}</span>
          </div>
        </div>
      </div>
    """)


# --- the batch ------------------------------------------------------------

# file:// so the headless render can read them off disk; these are the same
# frames the landing page ships.
PHOTO_DIR = (HERE.parent / "public/img/campaigns/fall-mini-sessions").resolve().as_uri() + "/"
_FALL = campaign_facts("fall-mini-sessions")

ASSETS = {
    # Instagram carousel: sells the SOCIAL_LAYER bundle
    "ig-carousel-1": (IG_W, IG_H, carousel_slide(
        1, 5, "Gray Content Studio",
        "One shoot day. A month of content.",
        "How a single half-day at your business becomes four weeks of posts.")),
    "ig-carousel-2": (IG_W, IG_H, carousel_slide(
        2, 5, "What you get", "", None, big="4",
        big_label="platform-native reels")),
    "ig-carousel-3": (IG_W, IG_H, carousel_slide(
        3, 5, "Included", "Captions, verticals, thumbnails.",
        "Every cut sized and captioned for the platform it runs on — "
        "not one export blasted everywhere.")),
    "ig-carousel-4": (IG_W, IG_H, carousel_slide(
        4, 5, "Starting at", "",
        "Strategy session, half-day shoot, four finished reels.",
        big="$1,400", big_label="per month")),
    "ig-carousel-5": (IG_W, IG_H, carousel_slide(
        5, 5, "Richmond, VA",
        "Text us. We'll send the reel.",
        "(540) 558-5894 · graycontentstudio.co")),

    # YouTube thumbnails, mapped to existing blog posts
    "yt-cost": (1280, 720, yt_thumb(
        "Video production", "What it actually", "costs in 2026",
        stat=("4", "cost layers most quotes hide"))),
    "yt-brandfilm": (1280, 720, yt_thumb(
        "Brand strategy", "Why your business", "needs a brand film")),
    "yt-shortform": (1280, 720, yt_thumb(
        "Short form", "The 3-second", "hook, explained",
        stat=("1.5s", "to earn the next second"))),

    # Instagram 1:1 anchor card — same wedge, square for the IG feed
    "ig-credentials": (IG_W, IG_H, square_credentials(
        "Richmond, Virginia",
        "Broadcast-grade video. Small-business pricing.",
        "Campaign work for Fortune 500 brands — now building content engines "
        "for Richmond businesses. From $1,400/month.",
        ["ExxonMobil", "Anthem", "Dominion Energy", "iHeartRadio", "LL Flooring"])),

    # Facebook / OG card: the credential-asymmetry wedge
    "fb-credentials": (1200, 630, fb_card(
        "Richmond, Virginia",
        "Broadcast-grade video. Small-business pricing.",
        "The studio behind campaign work for Fortune 500 brands — now building "
        "content engines for Richmond businesses. Packages from $1,400/month.",
        ["ExxonMobil", "Anthem", "Dominion Energy", "iHeartRadio", "LL Flooring"])),

    # Reel cover frames for the before/after format
    "reel-before": (1080, 1920, reel_frame(
        "BEFORE", "Shot on a phone.",
        "The footage most businesses settle for.")),
    "reel-after": (1080, 1920, reel_frame(
        "AFTER", "Same location. Same day.",
        "Lit, graded, and cut for the platform.")),

    # Same pair at 4:5 for feed posts (9:16 gets cropped in feed)
    "post-before": (1080, 1350, reel_frame(
        "BEFORE", "Shot on a phone.",
        "The footage most businesses settle for.", h=1350)),
    "post-after": (1080, 1350, reel_frame(
        "AFTER", "Same location. Same day.",
        "Lit, graded, and cut for the platform.", h=1350)),

    # --- Seasonal campaign ------------------------------------------------
    # Every line mirrors src/modules/campaigns/campaigns.ts. Nothing about
    # dates, locations or spot counts is stated beyond what the offer commits
    # to — the page says those are confirmed on booking, so this does too.
    "post-fall-mini": (IG_W, IG_H, offer_post(
        "\U0001F342 Fall Photo Special \U0001F4F8",
        "Fall Mini Sessions",
        "$150", "per session",
        ["30-minute session",
         "Up to 25 edited digital photos",
         "Outdoor fall location",
         "Couples, families, portraits &amp; kids"],
        footer="Limited spots")),

    "post-fall-book": (IG_W, IG_H, reel_frame(
        "BOOKING NOW", "Limited spots available this fall.",
        "Message us to book — we'll confirm the date, location, and details.",
        h=IG_H)),

    # --- Evergreen --------------------------------------------------------
    # Mirrors EVENT_PACKAGES[0] in src/content/site.ts.
    # --- Paid: Facebook / Instagram ad creative ---------------------------
    # 1:1 and 4:5 only. The 1.91:1 link-ad ratio takes the least vertical space
    # in feed and loses 71% of its width when a placement crops it to 9:16.
    # Price, title and the spec row are read out of campaigns.ts at build time
    # so a paid creative cannot drift from the page it points at.
    **{
        f"ad-fall-{label}": (aw, ah, photo_ad(
            # The landscape frame for both ratios. The portrait one is too tall
            # to clear the panel: fitting the women's heads in put the boy's
            # face through the panel edge, and no focal point fixes both at
            # once. A landscape source crops on width, where this frame has
            # grass to spare on either side and nobody near the edges.
            PHOTO_DIR + "family-of-four.jpg",
            "Fall Photo Special",
            _FALL["title"], _FALL["price"], _FALL["highlights"],
            "Limited spots this fall",
            "graycontentstudio.co/fall-mini-sessions",
            aw, ah,
            # Bias up slightly so the faces sit in the upper half of the
            # band rather than against the panel edge.
            focal="center 42%",
        ))
        for label, aw, ah in (("1x1", 1080, 1080), ("4x5", 1080, 1350))
    },

    "post-event-coverage": (IG_W, IG_H, offer_post(
        "Event coverage",
        "Your event, documented properly.",
        "$450", "starting at",
        ["Up to 2 hours of coverage",
         "40+ professionally edited photographs",
         "Guest candids and key moments",
         "Online gallery in 5\u20137 business days"],
        footer="Book a date")),
}


def to_jpeg(png: Path) -> Path | None:
    """Instagram's Graph API documents JPEG-only source URLs, so mirror every
    PNG as a high-quality JPEG.

    Note: the ffmpeg bundled with Playwright cannot do this — that build ships a
    PNG *encoder* but no PNG decoder, so it rejects our own output. Pillow it is.
    """
    try:
        from PIL import Image
    except ImportError:
        print("  Pillow missing — run: pip install Pillow")
        return None
    jpg = JPG / f"{png.stem}.jpg"
    # flatten onto the brand ground; JPEG has no alpha channel
    im = Image.open(png).convert("RGB")
    im.save(jpg, "JPEG", quality=92, optimize=True, progressive=True)
    return jpg if jpg.exists() and jpg.stat().st_size > 1000 else None


def fetch_fonts():
    """Vendor Archivo + Hanken Grotesk next to the script, subsets and all."""
    import re, urllib.request
    UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
          "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")
    url = ("https://fonts.googleapis.com/css2?family=Archivo:wght@400;700;800"
           "&family=Hanken+Grotesk:wght@400;600&display=swap")
    FONTS.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    css = urllib.request.urlopen(req, timeout=60).read().decode()
    seen = {}

    def localize(m):
        u = m.group(1)
        if u not in seen:
            seen[u] = f"f{len(seen)}.woff2"
            data = urllib.request.urlopen(
                urllib.request.Request(u, headers={"User-Agent": UA}), timeout=60
            ).read()
            (FONTS / seen[u]).write_bytes(data)
        return f"url({seen[u]})"

    css = re.sub(r"url\((https://fonts\.gstatic\.com[^)]+)\)", localize, css)
    (FONTS / "fonts.css").write_text(css)
    print(f"fonts cached: {len(seen)} files in {FONTS}")


def main():
    import sys
    if "--fonts" in sys.argv:
        fetch_fonts()
        return
    OUT.mkdir(parents=True, exist_ok=True)
    JPG.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    ok, fail = [], []
    for name, (w, h, html) in ASSETS.items():
        f = TMP / f"{name}.html"
        f.write_text(html, encoding="utf-8")
        png = OUT / f"{name}.png"
        r = subprocess.run([
            CHROME, "--no-sandbox", "--disable-gpu",
            "--hide-scrollbars", "--force-device-scale-factor=1",
            # wait for fonts + layout to settle, else the capture races the
            # render and clips whichever row measured last
            "--run-all-compositor-stages-before-draw",
            "--virtual-time-budget=4000",
            f"--window-size={w},{h}", f"--screenshot={png}", f"file://{f}",
        ], capture_output=True, text=True, timeout=90)
        if png.exists() and png.stat().st_size > 1000:
            j = to_jpeg(png)
            jn = f"  + {j.stat().st_size//1024}KB jpg" if j else "  (no jpg)"
            ok.append(f"{name}  {w}x{h}  {png.stat().st_size//1024}KB png{jn}")
        else:
            fail.append(f"{name}: {r.stderr.strip()[:200]}")
    shutil.rmtree(TMP, ignore_errors=True)
    print("\n".join(ok))
    if fail:
        print("\nFAILED:")
        print("\n".join(fail))


if __name__ == "__main__":
    main()
