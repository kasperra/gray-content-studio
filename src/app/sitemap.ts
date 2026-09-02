import type { MetadataRoute } from "next";
import { CAMPAIGNS } from "@/modules/campaigns/campaigns";
import { CASE_STUDIES } from "@/content/case-studies";
import { BLOG_POSTS, INDUSTRIES } from "@/content/site";
import { SITE_URL as BASE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const statics = ["", "/work", "/pricing", "/event-coverage", "/process", "/blog", "/faq"].map((p) => ({
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
