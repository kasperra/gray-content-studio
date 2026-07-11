"use client";

import { useState, useTransition } from "react";
import { createInvoice } from "@/modules/crm/actions";

const fieldCls =
  "w-full font-body text-[0.95rem] text-ink bg-bg border border-rule rounded px-3.5 py-2.5 focus:outline-none focus:border-accent transition-colors";

export function NewInvoiceForm({ clients }: { clients: { id: string; company: string }[] }) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 transition-all hover:bg-transparent hover:text-accent cursor-pointer"
      >
        + New Invoice
      </button>
    );
  }

  return (
    <div className="bg-surface border border-rule rounded-lg p-6 max-w-136">
      <h2 className="font-display text-[1.15rem] font-semibold mb-4">New Invoice</h2>
      <div className="grid gap-3">
        <select className={fieldCls} value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Select client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.company}</option>
          ))}
        </select>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={fieldCls} placeholder="Invoice number (e.g. INV-001)" value={number} onChange={(e) => setNumber(e.target.value)} />
          <input className={fieldCls} type="number" min="0" step="0.01" placeholder="Amount ($)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <label className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted">Due date</label>
          <input className={fieldCls} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        {message && <p className="text-[#d98a7a] text-[0.85rem]">{message}</p>}
        <div className="flex gap-3">
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await createInvoice({ clientId, number, amount: parseFloat(amount) || 0, dueDate });
                if (res.ok) {
                  setOpen(false);
                  setNumber("");
                  setAmount("");
                  setDueDate("");
                  setMessage("");
                } else setMessage(res.message);
              })
            }
            className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 transition-all hover:bg-transparent hover:text-accent disabled:opacity-60 cursor-pointer"
          >
            {pending ? "Creating…" : "Create Invoice"}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full border border-rule text-muted font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 hover:text-ink transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
