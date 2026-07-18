import Link from "next/link";
import { Wordmark } from "@/components/Nav";
import { SignOutButton } from "./SignOutButton";

/**
 * Shared portal header. Wraps to a second line rather than overflowing on
 * narrow screens; single 76px row from sm up.
 */
export function PortalHeader({
  email,
  isAdmin = false,
}: {
  email?: string | null;
  isAdmin?: boolean;
}) {
  return (
    <header className="border-b border-rule">
      <div className="w-[min(1200px,92vw)] mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 sm:h-[76px] sm:flex-nowrap sm:py-0">
        <Wordmark />
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          {email && (
            <span className="text-muted text-[0.85rem] hidden md:inline truncate max-w-[24ch]">
              {email}
            </span>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="text-accent text-[0.85rem] font-semibold whitespace-nowrap hover:underline underline-offset-4 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Studio Admin →
            </Link>
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
