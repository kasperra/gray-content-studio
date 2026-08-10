#!/usr/bin/env python3
"""Renders Gray Content Studio social assets to PNG at exact platform dimensions.

Design tokens are read from the same values as src/app/globals.css so the assets
stay in sync with the site. Re-run after editing COPY below:

    python3 social-assets/build.py

Requires Chromium (already at /opt/pw-browsers/chromium) and the Archivo +
Hanken Grotesk fonts installed locally (see README in this folder).
"""

import subprocess
import shutil
from pathlib import Path

OUT = Path(__file__).parent / "png"
TMP = Path(__file__).parent / ".html"
CHROME = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"

# --- tokens: mirror of src/app/globals.css @theme -------------------------
BG = "#0b0b0c"
SURFACE = "#141416"
INK = "#f5f2ec"
MUTED = "#9b968e"
ACCENT = "#fac748"       # Tuscan Sun
MAHOGANY = "#301509"     # Rich Mahogany
RULE = "rgba(245,242,236,0.12)"

BASE = f"""
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

SQ = 1080  # Instagram square


def carousel_slide(n, total, eyebrow, headline, sub, big=None, big_label=None,
                   footer=None):
    """Instagram carousel slide, 1080x1080. Grid rows: header / body / footer."""
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
    hsize = 96 if len(headline) < 30 else (82 if len(headline) < 42 else 70)
    return page(SQ, SQ, f"""
      .grid {{ height:100%; padding:88px; display:grid;
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


def reel_frame(label, headline, sub):
    """Vertical reel title/cover frame, 1080x1920."""
    return page(1080, 1920, f"""
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


# --- the batch ------------------------------------------------------------
ASSETS = {
    # Instagram carousel: sells the SOCIAL_LAYER bundle
    "ig-carousel-1": (SQ, SQ, carousel_slide(
        1, 5, "Gray Content Studio",
        "One shoot day. A month of content.",
        "How a single half-day at your business becomes four weeks of posts.")),
    "ig-carousel-2": (SQ, SQ, carousel_slide(
        2, 5, "What you get", "", None, big="4",
        big_label="platform-native reels")),
    "ig-carousel-3": (SQ, SQ, carousel_slide(
        3, 5, "Included", "Captions, verticals, thumbnails.",
        "Every cut sized and captioned for the platform it runs on — "
        "not one export blasted everywhere.")),
    "ig-carousel-4": (SQ, SQ, carousel_slide(
        4, 5, "Starting at", "",
        "Strategy session, half-day shoot, four finished reels.",
        big="$1,400", big_label="per month")),
    "ig-carousel-5": (SQ, SQ, carousel_slide(
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
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
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
            ok.append(f"{name}.png  {w}x{h}  {png.stat().st_size//1024}KB")
        else:
            fail.append(f"{name}: {r.stderr.strip()[:200]}")
    shutil.rmtree(TMP, ignore_errors=True)
    print("\n".join(ok))
    if fail:
        print("\nFAILED:")
        print("\n".join(fail))


if __name__ == "__main__":
    main()
