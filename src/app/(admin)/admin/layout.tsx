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
      <header className="sticky top-0 z-50 border-b border-rule bg-bg/88 backdrop-blur-xl">
        <div className="w-[min(1200px,92vw)] mx-auto flex h-[76px] items-center justify-between gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <Wordmark />
            <span className="text-accent text-[0.8rem] font-semibold uppercase tracking-[0.16em] hidden lg:inline">
              Studio Admin
            </span>
          </div>
          <div className="flex items-center gap-4 min-w-0">
            <AdminTabs />
            <div className="shrink-0">
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="w-[min(1200px,92vw)] mx-auto py-12">{children}</main>
    </div>
  );
}
