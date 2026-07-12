import Link from "next/link";

const base =
  "inline-block rounded-full font-body text-[0.88rem] font-semibold uppercase tracking-[0.08em] px-[1.9em] py-[0.78em] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export function ButtonGold({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${base} bg-accent text-bg border border-accent hover:bg-transparent hover:text-accent ${className}`}
    >
      {children}
    </Link>
  );
}

export function ButtonGhost({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${base} bg-transparent text-ink border border-rule hover:border-accent hover:text-accent ${className}`}
    >
      {children}
    </Link>
  );
}

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-body text-[0.78rem] font-medium uppercase tracking-[0.32em] text-accent ${className}`}>
      {children}
    </p>
  );
}

export function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`font-display font-semibold leading-[1.08] tracking-[-0.015em] text-[clamp(2rem,4.5vw,3.4rem)] mt-2 ${className}`}
    >
      {children}
    </h2>
  );
}
