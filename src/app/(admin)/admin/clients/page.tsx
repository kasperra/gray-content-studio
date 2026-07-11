import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { NewClientForm } from "./NewClientForm";

export default async function ClientsPage() {
  const supabase = await createSupabaseServer();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, company, contact_name, contact_email, created_at, projects(id)")
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h1 className="font-display text-[1.6rem] font-semibold">Clients</h1>
      </div>

      <NewClientForm />

      {!clients?.length ? (
        <p className="text-muted mt-8">
          No clients yet — create one above, or convert a lead from the Leads inbox.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/admin/clients/${c.id}`}
              className="bg-surface border border-rule rounded-lg p-6 hover:border-accent/60 transition-colors"
            >
              <p className="font-display text-[1.2rem] font-semibold">{c.company}</p>
              <p className="text-muted text-[0.88rem] mt-1">
                {c.contact_name || "—"}
                {c.contact_email ? ` · ${c.contact_email}` : ""}
              </p>
              <p className="text-accent text-[0.78rem] font-semibold uppercase tracking-[0.14em] mt-3">
                {(c.projects as { id: string }[]).length} project{(c.projects as { id: string }[]).length === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
