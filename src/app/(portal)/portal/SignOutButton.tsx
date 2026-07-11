"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await createSupabaseBrowser().auth.signOut();
        router.replace("/");
        router.refresh();
      }}
      className="rounded-full border border-rule text-[0.8rem] font-medium uppercase tracking-[0.08em] px-4 py-1.5 text-muted hover:text-accent hover:border-accent transition-colors cursor-pointer"
    >
      Sign Out
    </button>
  );
}
