"use client";

import { useState } from "react";
import { FAQS } from "@/content/site";

export function FaqList() {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase();
  const visible = FAQS.filter(
    (f) => !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
  );

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search questions — pricing, revisions, travel…"
        aria-label="Search frequently asked questions"
        className="w-full font-body text-base text-ink bg-surface border border-rule rounded px-5 py-3.5 mb-10 focus:outline-none focus:border-accent transition-colors"
      />
      {visible.length === 0 && (
        <p className="text-muted">No matches — try a different word, or <a href="/#contact" className="text-accent hover:underline">ask us directly</a>.</p>
      )}
      <div className="space-y-4">
        {visible.map((f) => (
          <details key={f.q} className="group bg-surface border border-rule rounded-lg open:border-accent/50 transition-colors">
            <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-5">
              <span>
                <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-accent mb-1">{f.category}</span>
                <span className="font-display text-[1.1rem] font-semibold">{f.q}</span>
              </span>
              <span className="text-accent transition-transform group-open:rotate-45 text-[1.4rem] leading-none shrink-0">+</span>
            </summary>
            <p className="px-6 pb-6 text-muted leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </>
  );
}
