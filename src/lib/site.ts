/** The site's public origin, in one place.

    Every canonical URL, sitemap entry, robots directive, OG image URL, and
    JSON-LD @id is built from this. */

const FALLBACK = "https://www.graycontentstudio.co";

/** A *.vercel.app value is deliberately ignored.

    NEXT_PUBLIC_SITE_URL was set to the preview host, so the whole site was
    telling crawlers and social scrapers that gray-content-studio.vercel.app
    was its canonical home — splitting authority between two hostnames serving
    identical content. On a preview deployment the production domain is the
    right canonical anyway, since a preview should never be the indexed copy.

    Exported for the check in site.test.ts. */
export function resolveSiteUrl(configured: string | undefined): string {
  const clean = configured?.trim().replace(/\/+$/, "");
  if (!clean) return FALLBACK;
  let host: string;
  try {
    host = new URL(clean).hostname;
  } catch {
    return FALLBACK; // a malformed value must not reach a canonical tag
  }
  return /\.vercel\.app$/i.test(host) ? FALLBACK : clean;
}

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
