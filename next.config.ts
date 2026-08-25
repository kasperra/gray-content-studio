import type { NextConfig } from "next";

/* The production build is served on both the custom domain and Vercel's
   auto-assigned <project>.vercel.app alias, so the whole site was reachable at
   two hostnames returning 200. Canonical tags tell crawlers which one wins;
   this makes it unambiguous by bouncing the alias the same way the apex already
   bounces to www.

   Gated on VERCEL_ENV so it only applies to production builds. Preview
   deployments live on *.vercel.app too — without the gate, every branch preview
   would redirect to production and become impossible to review. */
const isProduction = process.env.VERCEL_ENV === "production";

const nextConfig: NextConfig = {
  async redirects() {
    if (!isProduction) return [];
    return [
      {
        // Everything except Google's ownership-verification files. Search
        // Console requires a 200 at the exact verification URL and does not
        // follow a redirect to another host, so a blanket redirect would make
        // the .vercel.app property impossible to verify — and that property is
        // how we watch these redirects consolidate the duplicate index.
        source: "/:path((?!google[0-9a-z]+\\.html$).*)",
        has: [{ type: "host", value: "(?<vercelHost>.*\\.vercel\\.app)" }],
        destination: "https://www.graycontentstudio.co/:path",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
