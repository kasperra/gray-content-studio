"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-full bg-[#0b0b0c] text-white font-semibold uppercase text-[0.82rem] tracking-[0.08em] px-8 py-3.5 hover:bg-[#2a2a2e] transition-colors cursor-pointer"
    >
      Download PDF
    </button>
  );
}
