"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

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

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Studio sections"
      className="flex items-center gap-4 lg:gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-1 px-1"
    >
      {tabs.map((t) => {
        const active = isActive(pathname, t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`relative shrink-0 py-1 text-[0.82rem] font-medium rounded-sm transition-colors ${focusRing} ${
              active ? "text-ink" : "text-muted hover:text-ink"
            } after:absolute after:-bottom-0.5 after:left-0 after:h-px after:bg-accent after:transition-all after:duration-300 ${
              active ? "after:w-full" : "after:w-0 hover:after:w-full"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
      <Link
        href="/"
        className={`shrink-0 hidden xl:inline text-[0.82rem] text-muted hover:text-ink transition-colors rounded-sm ${focusRing}`}
      >
        View Site
      </Link>
    </nav>
  );
}
