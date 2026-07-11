"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClientRecord } from "@/modules/clients/actions";

const fieldCls =
  "w-full font-body text-[0.95rem] text-ink bg-bg border border-rule rounded px-3.5 py-2.5 focus:outline-none focus:border-accent transition-colors";

export function NewClientForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 transition-all hover:bg-transparent hover:text-accent cursor-pointer"
      >
        + New Client
      </button>
    );
  }

  return (
    <div className="bg-surface border border-rule rounded-lg p-6 max-w-136">
      <h2 className="font-display text-[1.15rem] font-semibold mb-4">New Client</h2>
      <div className="grid gap-3">
        <input className={fieldCls} placeholder="Company name *" value={company} onChange={(e) => setCompany(e.target.value)} />
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={fieldCls} placeholder="Contact name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          <input className={fieldCls} type="email" placeholder="Contact email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </div>
        {message && <p className="text-[#d98a7a] text-[0.85rem]">{message}</p>}
        <div className="flex gap-3">
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await createClientRecord({ company, contactName, contactEmail });
                if (res.ok && res.id) router.push(`/admin/clients/${res.id}`);
                else setMessage(res.message);
              })
            }
            className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 transition-all hover:bg-transparent hover:text-accent disabled:opacity-60 cursor-pointer"
          >
            {pending ? "Creating…" : "Create Client"}
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
