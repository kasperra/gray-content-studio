"use client";

import { useState } from "react";
import { getDownloadUrl } from "@/lib/storage";

type Deliverable = {
  id: string;
  title: string;
  status: "pending" | "in_review" | "approved" | "delivered";
  storagePath: string | null;
};

const statusStyle: Record<Deliverable["status"], string> = {
  pending: "border-rule text-muted",
  in_review: "border-[#8db4d9]/40 text-[#8db4d9]",
  approved: "border-[#8ec98e]/40 text-[#8ec98e]",
  delivered: "border-accent/50 text-accent",
};

const statusLabel: Record<Deliverable["status"], string> = {
  pending: "In production",
  in_review: "Ready for review",
  approved: "Approved",
  delivered: "Delivered",
};

export function DeliverableList({ deliverables }: { deliverables: Deliverable[] }) {
  const [busy, setBusy] = useState<string | null>(null);

  if (!deliverables.length) {
    return (
      <p className="text-muted text-[0.9rem]">
        Your files will appear here as they&apos;re ready — review cuts first, final masters on
        approval.
      </p>
    );
  }

  const download = async (d: Deliverable) => {
    if (!d.storagePath) return;
    setBusy(d.id);
    try {
      const url = await getDownloadUrl("deliverables", d.storagePath);
      if (url) window.open(url, "_blank");
      else alert("Could not generate a download link — please contact the studio.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <ul className="space-y-3">
      {deliverables.map((d) => (
        <li key={d.id} className="flex items-center justify-between gap-4 border border-rule rounded-md px-4 py-3 flex-wrap">
          <span className="font-medium text-[0.95rem]">{d.title}</span>
          <div className="flex items-center gap-2.5">
            <span className={`rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.1em] ${statusStyle[d.status]}`}>
              {statusLabel[d.status]}
            </span>
            {d.storagePath && (
              <button
                onClick={() => download(d)}
                disabled={busy === d.id}
                className="rounded-full bg-accent text-bg border border-accent text-[0.75rem] font-semibold uppercase tracking-[0.08em] px-4 py-1.5 hover:bg-transparent hover:text-accent transition-all disabled:opacity-60 cursor-pointer"
              >
                {busy === d.id ? "…" : "Download"}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
