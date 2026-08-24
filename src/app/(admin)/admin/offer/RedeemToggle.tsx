"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setClaimRedeemed } from "@/modules/offer/actions";

/* Redemption is marked by hand: there is no checkout in this app for a coupon
   to be redeemed against, so the studio records it when it applies the discount
   to a proposal. */
export function RedeemToggle({ id, redeemed }: { id: string; redeemed: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setClaimRedeemed(id, String(!redeemed));
          router.refresh();
        })
      }
      className={`rounded-full border text-[0.68rem] font-semibold uppercase tracking-[0.08em] px-2.5 py-1 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap ${
        redeemed
          ? "border-[#8ec98e] text-[#8ec98e] hover:bg-[#8ec98e1a]"
          : "border-rule text-muted hover:text-accent hover:border-accent"
      }`}
      title={redeemed ? "Mark as not redeemed" : "Mark as redeemed"}
    >
      {pending ? "…" : redeemed ? "Redeemed" : "Mark used"}
    </button>
  );
}
