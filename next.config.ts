import type { NextConfig } from "next";

/* The app answers on more than one hostname, so the whole site is reachable at
   several addresses returning 200. Canonical tags tell crawlers which one wins;
   these redirects make it unambiguous, the same way the apex already bounces
   to www.

   This rule used to target Vercel's <project>.vercel.app alias and was gated on
   `VERCEL_ENV === "production"`. The site moved to a VPS (Coolify), where that
   variable is never set — so the gate was always false and the redirect had
   quietly stopped running, while Coolify's own auto-assigned
   <uuid>.<ip>.sslip.io address served a full duplicate of the site.

   Deliberately NOT a blanket "any host that isn't www" rule:
     - diagnostic.graycontentstudio.co is an intentional second hostname, served
       by the rewrite in proxy.ts, and must keep answering on its own name.
     - The container's Docker HEALTHCHECK curls http://localhost:3000/, and dev
       runs on localhost too.
   Matching the duplicate hosts by name keeps www and those two out of it
   entirely, so there is no way for this to turn into a redirect loop. Any
   further stray hostname gets added to HOSTS below. */
const DUPLICATE_HOSTS = [
  // Coolify's auto-assigned address for the app (<uuid>.<server-ip>.sslip.io).
  String.raw`.*\.sslip\.io`,
  // The old Vercel alias, kept until that deployment is fully de-indexed.
  String.raw`.*\.vercel\.app`,
];

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (VPS / Coolify).
  output: "standalone",
  async redirects() {
    return DUPLICATE_HOSTS.map((host) => ({
      /* Everything except Google's ownership-verification files. Search Console
         requires a 200 at the exact verification URL and does not follow a
         redirect to another host, so including them would make the duplicate
         host impossible to verify as a property — and that property is how we
         watch these redirects consolidate the duplicate index. */
      source: "/:path((?!google[0-9a-z]+\\.html$).*)",
      has: [{ type: "host" as const, value: host }],
      destination: "https://www.graycontentstudio.co/:path",
      permanent: true,
    }));
  },
};

export default nextConfig;
