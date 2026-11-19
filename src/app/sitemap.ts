import type { MetadataRoute } from "next";
import { CAMPAIGNS } from "@/modules/campaigns/campaigns";
import { CASE_STUDIES } from "@/content/case-studies";
import { BLOG_POSTS, INDUSTRIES } from "@/content/site";
import { SITE_URL as BASE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  /* `/industries` is the hub for the eight vertical pages.

     `/diagnostic` is deliberately absent. It is served from its own subdomain
     (proxy.ts rewrites diagnostic.* onto /diagnostic) and its page hardcodes
     its canonical to https://diagnostic.graycontentstudio.co, so listing the
     www copy here would put a URL in the sitemap that points its canonical at
     a different host — asking Google to index a page that disclaims itself.
     If the diagnostic ever needs a sitemap, it belongs on that subdomain. */
  const statics = [
    "",
    "/work",
    "/pricing",
    "/industries",
    "/event-coverage",
    "/process",
    "/blog",
    "/faq",
  ].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  const work = CASE_STUDIES.map((c) => ({
    url: `${BASE}/work/${c.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const industries = INDUSTRIES.map((i) => ({
    url: `${BASE}/industries/${i.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const blog = BLOG_POSTS.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p.date,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));
  // Seasonal campaigns, only while they're published. Read from the code
  // defaults rather than the config store so the sitemap stays a pure function
  // — a season switched off in Admin drops out on the next deploy, and its page
  // 404s immediately either way.
  const campaigns = CAMPAIGNS.filter((c) => c.published).map((c) => ({
    url: `${BASE}/${c.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  const legal = ["/privacy", "/terms", "/offer-terms"].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "yearly" as const,
    priority: 0.2,
  }));
  return [...statics, ...work, ...industries, ...blog, ...campaigns, ...legal];
}
