import Link from "next/link";

/* Standalone shell for the diagnostic subdomain. Deliberately does not reuse the
   marketing site's Nav — this is a focused funnel, and a full nav is an exit. */

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/diagnostic"
      className={`font-display text-[0.78rem] sm:text-[0.86rem] font-semibold uppercase tracking-[0.2em] whitespace-nowrap rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${className}`}
    >
      Gray<span className="text-accent">·</span>Content<span className="text-accent">·</span>Studio
    </Link>
  );
}

export function DiagnosticFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col">
      <div className="grow">{children}</div>
      <footer className="border-t border-rule mt-auto">
        <div className="w-[min(1080px,92vw)] mx-auto py-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-muted text-[0.82rem]">
            © {new Date().getFullYear()} Gray Content Studio
          </p>
          <a
            href="https://www.graycontentstudio.co"
            className="text-muted text-[0.82rem] hover:text-accent transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            graycontentstudio.co →
          </a>
        </div>
      </footer>
    </div>
  );
}
