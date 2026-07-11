import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/content/site";
import { Container } from "@/components/sections";
import { Eyebrow } from "@/components/Buttons";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Blog — Production Tips & Marketing Insights",
  description:
    "Production tips, video marketing strategy, and behind-the-scenes insights from Gray Content Studio.",
};

export default function BlogIndexPage() {
  const posts = [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <section className="pt-48 pb-12">
        <Container>
          <Eyebrow>Blog</Eyebrow>
          <h1 className="font-display font-semibold leading-[1.08] tracking-[-0.015em] text-[clamp(2.6rem,7vw,5.5rem)] mt-4">
            Notes from the studio
          </h1>
        </Container>
      </section>
      <section className="pb-28">
        <Container className="max-w-176 space-y-6">
          {posts.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.08}>
              <Link
                href={`/blog/${p.slug}`}
                className="block bg-surface border border-rule rounded-lg p-7 hover:border-accent/60 transition-colors"
              >
                <div className="flex items-center gap-4 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-accent">
                  <span>{p.category}</span>
                  <span className="text-muted normal-case tracking-normal font-normal">
                    {new Date(p.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {p.readMinutes} min read
                  </span>
                </div>
                <h2 className="font-display text-[1.5rem] font-semibold mt-2.5">{p.title}</h2>
                <p className="text-muted mt-2.5">{p.description}</p>
              </Link>
            </Reveal>
          ))}
        </Container>
      </section>
    </>
  );
}
