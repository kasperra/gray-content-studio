import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Wordmark } from "@/components/Nav";
import { SignOutButton } from "@/app/(portal)/portal/SignOutButton";

export const metadata: Metadata = {
  title: "Studio Admin",
  robots: { index: false, follow: false },
};

const tabs = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/crm", label: "CRM" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/proposals", label: "Proposals" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/assets", label: "Assets" },
  { href: "/admin/social", label: "Social" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-svh">
      <header className="h-[76px] flex items-center border-b border-rule sticky top-0 bg-bg/88 backdrop-blur-xl z-50">
        <div className="w-[min(1200px,92vw)] mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Wordmark />
            <span className="text-accent text-[0.8rem] font-semibold uppercase tracking-[0.16em] hidden sm:inline">
              Studio Admin
            </span>
          </div>
          <nav className="flex items-center gap-3.5 lg:gap-5 flex-wrap justify-end">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="text-[0.82rem] font-medium text-muted hover:text-ink transition-colors"
              >
                {t.label}
              </Link>
            ))}
            <Link href="/" className="hidden xl:inline text-[0.82rem] text-muted hover:text-ink transition-colors">
              View Site
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="w-[min(1200px,92vw)] mx-auto py-12">{children}</main>
    </div>
  );
}
