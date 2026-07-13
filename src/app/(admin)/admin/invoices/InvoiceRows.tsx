"use client";

import { useTransition } from "react";
import { setInvoiceStatus, deleteInvoice } from "@/modules/crm/actions";
import { money } from "@/modules/pricing/data";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

type Row = {
  id: string;
  number: string;
  amount: number;
  dueDate: string | null;
  status: "draft" | "sent" | "paid" | "overdue";
  company: string;
  isPastDue: boolean;
};

const STATUSES: Row["status"][] = ["draft", "sent", "paid", "overdue"];

const statusColor: Record<Row["status"], string> = {
  draft: "text-muted border-rule",
  sent: "text-[#8db4d9] border-[#8db4d9]/40",
  paid: "text-[#8ec98e] border-[#8ec98e]/40",
  overdue: "text-[#d98a7a] border-[#d98a7a]/40",
};

export function InvoiceRows({ rows }: { rows: Row[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <>
      {rows.map((r) => (
        <tr key={r.id} className="border-b border-rule align-middle">
          <td className="py-3.5 pr-4 font-medium">
            {r.number}
            {r.isPastDue && (
              <span className="ml-2 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[#d98a7a]">
                past due
              </span>
            )}
          </td>
          <td className="py-3.5 pr-4 text-muted">{r.company}</td>
          <td className="py-3.5 pr-4 text-accent font-semibold tabular-nums">{money(r.amount)}</td>
          <td className="py-3.5 pr-4 hidden sm:table-cell text-muted">{r.dueDate ?? "—"}</td>
          <td className="py-3.5">
            <div className="flex items-center gap-3">
              <select
                value={r.status}
                disabled={pending}
                onChange={(e) => startTransition(() => setInvoiceStatus(r.id, e.target.value as Row["status"]))}
                aria-label={`Status of invoice ${r.number}`}
                className={`rounded-full border bg-transparent text-[0.72rem] font-semibold uppercase tracking-[0.1em] px-3 py-1 cursor-pointer ${statusColor[r.status]}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-surface text-ink">{s}</option>
                ))}
              </select>
              <ConfirmDeleteButton
                action={deleteInvoice}
                args={[r.id]}
                itemName={`invoice ${r.number}`}
                variant="inline"
              />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
