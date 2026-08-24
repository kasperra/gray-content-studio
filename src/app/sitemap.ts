import type { MetadataRoute } from "next";
import { CASE_STUDIES } from "@/content/case-studies";
import { BLOG_POSTS, INDUSTRIES } from "@/content/site";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gray-content-studio.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const statics = ["", "/work", "/pricing", "/process", "/blog", "/faq"].map((p) => ({
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
  const legal = ["/privacy", "/terms", "/offer-terms"].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "yearly" as const,
    priority: 0.2,
  }));
  return [...statics, ...work, ...industries, ...blog, ...legal];
}
