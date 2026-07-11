"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`font-display text-[1.02rem] font-semibold uppercase tracking-[0.22em] whitespace-nowrap ${className}`}
    >
      Gray<span className="text-accent">·</span>Content<span className="text-accent">·</span>Studio
    </Link>
  );
}

const links = [
  { href: "/work", label: "Work" },
  { href: "/pricing", label: "Pricing" },
  { href: "/process", label: "Process" },
  { href: "/blog", label: "Blog" },
  { href: "/portal", label: "Client Login" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-100 h-[76px] flex items-center transition-all duration-400 ${
        scrolled ? "bg-bg/88 backdrop-blur-xl shadow-[0_1px_0_var(--color-rule)]" : ""
      }`}
    >
      <div className="w-[min(1200px,92vw)] mx-auto flex items-center justify-between gap-8">
        <Wordmark />
        <nav className="flex items-center gap-6 lg:gap-9">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hidden md:inline text-[0.88rem] font-medium tracking-[0.06em] text-muted hover:text-ink transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/#contact"
            className="inline-block rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.8rem] tracking-[0.08em] px-[1.5em] py-[0.62em] transition-all duration-200 hover:bg-transparent hover:text-accent hover:-translate-y-0.5"
          >
            Start a Project
          </Link>
        </nav>
      </div>
    </header>
  );
}
