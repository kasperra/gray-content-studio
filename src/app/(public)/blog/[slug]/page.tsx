import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getBlogPost } from "@/content/site";
import { Container } from "@/components/sections";
import { Eyebrow, ButtonGold } from "@/components/Buttons";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const post = getBlogPost((await params).slug);
  if (!post) return {};
  return { title: post.title, description: post.description };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getBlogPost((await params).slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Gray Content Studio" },
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="pt-48 pb-12">
        <Container className="max-w-176">
          <Eyebrow>
            {post.category} ·{" "}
            {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}{" "}
            · {post.readMinutes} min read
          </Eyebrow>
          <h1 className="font-display font-semibold leading-[1.1] tracking-[-0.015em] text-[clamp(2.2rem,5.5vw,4rem)] mt-4">
            {post.title}
          </h1>
        </Container>
      </section>
      <section className="pb-20">
        <Container className="max-w-176">
          <div className="space-y-6 text-[1.05rem] leading-[1.8] text-ink/85">
            {post.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="mt-14 pt-8 border-t border-rule flex flex-wrap items-center justify-between gap-6">
            <Link href="/blog" className="text-muted text-[0.9rem] hover:text-ink transition-colors">
              ← All articles
            </Link>
            <ButtonGold href="/#contact">Start a Project</ButtonGold>
          </div>
        </Container>
      </section>
    </article>
  );
}
