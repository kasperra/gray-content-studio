import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { Wordmark } from "@/components/Nav";
import { SignOutButton } from "@/app/(portal)/portal/SignOutButton";
import { AdminTabs } from "./AdminTabs";

export const metadata: Metadata = {
  title: "Studio Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-svh">
      {/* Wraps to two rows on small screens (identity + sign out, then the tab
          strip); collapses to a single row from lg up. One <AdminTabs/> only. */}
      <header className="sticky top-0 z-50 border-b border-rule bg-bg/88 backdrop-blur-xl">
        <div className="w-[min(1200px,92vw)] mx-auto flex flex-wrap items-center gap-x-5 gap-y-1 py-2.5 lg:h-[76px] lg:flex-nowrap lg:gap-x-6 lg:py-0">
          <div className="flex min-w-0 items-center gap-3 mr-auto lg:mr-0 lg:order-1">
            <Wordmark className="hidden sm:inline-block" />
            <span className="text-accent text-[0.78rem] font-semibold uppercase tracking-[0.16em] sm:hidden">
              Studio Admin
            </span>
            <span className="hidden xl:inline text-accent text-[0.8rem] font-semibold uppercase tracking-[0.16em]">
              Studio Admin
            </span>
          </div>

          <div className="shrink-0 lg:order-3">
            <SignOutButton />
          </div>

          <div className="w-full min-w-0 lg:w-auto lg:flex-1 lg:order-2">
            <AdminTabs />
          </div>
        </div>
      </header>
      <main className="w-[min(1200px,92vw)] mx-auto py-8 sm:py-12">{children}</main>
    </div>
  );
}
