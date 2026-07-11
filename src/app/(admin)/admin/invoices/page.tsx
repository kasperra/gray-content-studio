import { createSupabaseServer } from "@/lib/supabase/server";
import { money } from "@/modules/pricing/data";
import { InvoiceRows } from "./InvoiceRows";
import { NewInvoiceForm } from "./NewInvoiceForm";

export default async function InvoicesPage() {
  const supabase = await createSupabaseServer();
  const [{ data: invoices }, { data: clients }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, number, amount, due_date, status, created_at, clients(company)")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, company").order("company"),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const rows = (invoices ?? []).map((i) => ({
    id: i.id,
    number: i.number,
    amount: Number(i.amount),
    dueDate: i.due_date,
    status: i.status as "draft" | "sent" | "paid" | "overdue",
    company: (i.clients as unknown as { company: string } | null)?.company ?? "—",
    isPastDue: i.status === "sent" && !!i.due_date && i.due_date < today,
  }));

  const outstanding = rows.filter((r) => r.status === "sent" || r.status === "overdue").reduce((s, r) => s + r.amount, 0);
  const paid = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h1 className="font-display text-[1.6rem] font-semibold">Invoices</h1>
        <div className="flex gap-6 text-[0.88rem]">
          <span className="text-muted">
            Outstanding: <strong className="text-accent">{money(outstanding)}</strong>
          </span>
          <span className="text-muted">
            Collected: <strong className="text-[#8ec98e]">{money(paid)}</strong>
          </span>
        </div>
      </div>

      <NewInvoiceForm clients={(clients ?? []).map((c) => ({ id: c.id, company: c.company }))} />

      {!rows.length ? (
        <p className="text-muted mt-8">No invoices yet.</p>
      ) : (
        <div className="overflow-x-auto mt-8">
          <table className="w-full border-collapse text-[0.92rem]">
            <thead>
              <tr className="text-left text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted border-b border-rule">
                <th className="py-2.5 pr-4">Invoice</th>
                <th className="py-2.5 pr-4">Client</th>
                <th className="py-2.5 pr-4">Amount</th>
                <th className="py-2.5 pr-4 hidden sm:table-cell">Due</th>
                <th className="py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              <InvoiceRows rows={rows} />
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
