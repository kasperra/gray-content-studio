import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { stageLabel } from "@/modules/projects/stages";
import { ClientLoginPanel } from "./ClientLoginPanel";
import { NewProjectForm } from "./NewProjectForm";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();

  const [{ data: projects }, { data: profiles }, { data: contracts }, { data: invoices }] =
    await Promise.all([
      supabase.from("projects").select("id, title, stage, due_date").eq("client_id", id).order("created_at", { ascending: false }),
      createSupabaseAdmin().from("profiles").select("id, name").eq("client_id", id),
      supabase.from("contracts").select("id, title, status").eq("client_id", id),
      supabase.from("invoices").select("id, number, amount, status").eq("client_id", id),
    ]);

  return (
    <>
      <Link href="/admin/clients" className="text-muted text-[0.85rem] hover:text-ink transition-colors">
        ← All clients
      </Link>
      <h1 className="font-display text-[1.8rem] font-semibold mt-2">{client.company}</h1>
      <p className="text-muted text-[0.92rem] mt-1">
        {client.contact_name || "—"}
        {client.contact_email ? ` · ${client.contact_email}` : ""}
      </p>
      {client.notes && <p className="text-muted text-[0.88rem] mt-3 max-w-136 whitespace-pre-wrap">{client.notes}</p>}

      <div className="grid lg:grid-cols-2 gap-6 mt-10">
        <section className="bg-surface border border-rule rounded-lg p-6">
          <h2 className="font-display text-[1.2rem] font-semibold mb-4">Projects</h2>
          {!projects?.length ? (
            <p className="text-muted text-[0.9rem]">No projects yet.</p>
          ) : (
            <ul className="space-y-3 mb-5">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/projects/${p.id}`}
                    className="flex items-center justify-between gap-4 border border-rule rounded-md px-4 py-3 hover:border-accent/60 transition-colors"
                  >
                    <span className="font-medium text-[0.95rem]">{p.title}</span>
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-accent">
                      {stageLabel(p.stage)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <NewProjectForm clientId={id} />
        </section>

        <div className="space-y-6">
          <ClientLoginPanel
            clientId={id}
            defaultEmail={client.contact_email ?? ""}
            defaultName={client.contact_name ?? ""}
            existingLogins={(profiles ?? []).map((p) => p.name || "Unnamed user")}
          />

          <section className="bg-surface border border-rule rounded-lg p-6">
            <h2 className="font-display text-[1.2rem] font-semibold mb-4">Documents</h2>
            {!contracts?.length && !invoices?.length ? (
              <p className="text-muted text-[0.9rem]">
                No contracts or invoices yet — add them from any of this client&apos;s project pages.
              </p>
            ) : (
              <ul className="space-y-2 text-[0.92rem]">
                {(contracts ?? []).map((c) => (
                  <li key={c.id} className="flex justify-between gap-4">
                    <span>📄 {c.title}</span>
                    <span className="text-muted uppercase text-[0.75rem] font-semibold tracking-[0.1em]">{c.status}</span>
                  </li>
                ))}
                {(invoices ?? []).map((i) => (
                  <li key={i.id} className="flex justify-between gap-4">
                    <span>🧾 {i.number}</span>
                    <span className="text-muted uppercase text-[0.75rem] font-semibold tracking-[0.1em]">
                      ${Number(i.amount).toLocaleString()} · {i.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
