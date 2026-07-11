"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/modules/projects/actions";

const fieldCls =
  "w-full font-body text-[0.95rem] text-ink bg-bg border border-rule rounded px-3.5 py-2.5 focus:outline-none focus:border-accent transition-colors";

export function NewProjectForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-rule text-muted font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 hover:text-accent hover:border-accent transition-colors cursor-pointer"
      >
        + New Project
      </button>
    );
  }

  return (
    <div className="grid gap-3 border-t border-rule pt-4">
      <input className={fieldCls} placeholder="Project title *" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="grid gap-1">
        <label className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted">Due date (optional)</label>
        <input className={fieldCls} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      {message && <p className="text-[#d98a7a] text-[0.85rem]">{message}</p>}
      <div className="flex gap-3">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await createProject({ clientId, title, dueDate });
              if (res.ok && res.id) router.push(`/admin/projects/${res.id}`);
              else setMessage(res.message);
            })
          }
          className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 transition-all hover:bg-transparent hover:text-accent disabled:opacity-60 cursor-pointer"
        >
          {pending ? "Creating…" : "Create"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-full border border-rule text-muted font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 hover:text-ink transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
