"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`font-display text-[1.02rem] font-semibold uppercase tracking-[0.22em] whitespace-nowrap rounded-sm ${focusRing} ${className}`}
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

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // While the drawer is open: lock body scroll and close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-100 h-[76px] flex items-center transition-all duration-400 ${
          scrolled || open ? "bg-bg/88 backdrop-blur-xl shadow-[0_1px_0_var(--color-rule)]" : ""
        }`}
      >
      <div className="w-[min(1200px,92vw)] mx-auto flex items-center justify-between gap-8">
        <Wordmark />

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-9">
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative text-[0.88rem] font-medium tracking-[0.06em] rounded-sm transition-colors ${focusRing} ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                } after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-accent after:transition-all after:duration-300 ${
                  active ? "after:w-full" : "after:w-0 hover:after:w-full"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/#contact"
            className={`inline-block rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.8rem] tracking-[0.08em] px-[1.5em] py-[0.62em] transition-all duration-200 hover:bg-transparent hover:text-accent hover:-translate-y-0.5 ${focusRing}`}
          >
            Start a Project
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
          className={`md:hidden relative -mr-2 grid h-11 w-11 place-items-center rounded-full text-ink ${focusRing}`}
        >
          <span className="relative block h-4 w-6" aria-hidden="true">
            <span
              className={`absolute left-0 block h-0.5 w-6 bg-current transition-all duration-300 ${
                open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 block h-0.5 w-6 -translate-y-1/2 bg-current transition-all duration-200 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-6 bg-current transition-all duration-300 ${
                open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
              }`}
            />
          </span>
        </button>
        </div>
      </header>

      {/* Mobile drawer — sibling of <header>, not a child, so the header's
          backdrop-filter can't turn the panel's background transparent. */}
      <div
        id="mobile-menu"
        className={`md:hidden fixed inset-x-0 top-[76px] bottom-0 z-40 bg-bg transition-[opacity,transform] duration-300 ease-out ${
          open ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-2"
        }`}
      >
        <nav className="w-[min(1200px,92vw)] mx-auto flex flex-col pt-6" aria-label="Mobile">
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-between border-b border-rule py-5 font-display text-[1.4rem] font-semibold rounded-sm transition-colors ${focusRing} ${
                  active ? "text-accent" : "text-ink hover:text-accent"
                }`}
              >
                {l.label}
                <span aria-hidden="true" className="text-muted text-[1rem]">
                  →
                </span>
              </Link>
            );
          })}
          <Link
            href="/#contact"
            className={`mt-8 inline-block rounded-full bg-accent text-bg border border-accent text-center font-semibold uppercase text-[0.88rem] tracking-[0.08em] px-[1.9em] py-[0.9em] transition-colors hover:bg-transparent hover:text-accent ${focusRing}`}
          >
            Start a Project
          </Link>
        </nav>
      </div>
    </>
  );
}
