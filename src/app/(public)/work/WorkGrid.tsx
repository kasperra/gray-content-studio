"use client";

import { useState } from "react";
import { CASE_STUDIES, CATEGORIES } from "@/content/case-studies";
import { WorkCard } from "@/components/sections";

export function WorkGrid() {
  const [filter, setFilter] = useState<string>("all");
  const visible = CASE_STUDIES.filter((c) => filter === "all" || c.category === filter);

  return (
    <>
      <div role="group" aria-label="Filter projects by category" className="flex flex-wrap gap-3 mb-12">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`rounded-full border px-[1.4em] py-[0.55em] text-[0.82rem] font-medium uppercase tracking-[0.12em] transition-colors cursor-pointer ${
              filter === cat.id
                ? "bg-accent text-bg border-accent"
                : "text-muted border-rule hover:text-ink hover:border-muted"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((cs, i) => (
          <WorkCard key={cs.slug} cs={cs} delay={(i % 3) * 0.08} />
        ))}
      </div>
    </>
  );
}
