import Link from "next/link";
import { Wordmark } from "./Nav";

const cols = [
  {
    title: "Studio",
    links: [
      { href: "/work", label: "Work" },
      { href: "/process", label: "Process" },
      { href: "/pricing", label: "Pricing" },
      { href: "/event-coverage", label: "Event Coverage" },
      { href: "/#services", label: "Services" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/diagnostic", label: "Content Diagnostic" },
      { href: "/blog", label: "Blog" },
      { href: "/faq", label: "FAQ" },
      { href: "/industries/real-estate", label: "Industries" },
    ],
  },
  {
    title: "Clients",
    links: [
      { href: "/portal", label: "Client Portal" },
      { href: "/#contact", label: "Start a Project" },
    ],
  },
];

const legal = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/offer-terms", label: "Coupon Terms" },
];

export function Footer() {
  return (
    <footer className="border-t border-rule py-12">
      <div className="w-[min(1200px,92vw)] mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          <div>
            <Wordmark />
            <p className="text-muted text-[0.85rem] mt-3 max-w-[26rem]">
              Cinematic video production, editing, and animation for brands that demand to be watched.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10">
            {cols.map((col) => (
              <div key={col.title}>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-accent mb-3">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="text-[0.85rem] text-muted hover:text-ink transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-10 pt-6 border-t border-rule">
          <p className="text-[0.8rem] text-muted">
            © {new Date().getFullYear()} Gray Content Studio. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[0.8rem] text-muted hover:text-ink transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
