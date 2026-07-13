import { createSupabaseServer } from "@/lib/supabase/server";
import { NewClientForm } from "./NewClientForm";
import { ClientListCard } from "./ClientListCard";

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
            <ClientListCard
              key={c.id}
              id={c.id}
              company={c.company}
              contactName={c.contact_name}
              contactEmail={c.contact_email}
              projectCount={(c.projects as { id: string }[]).length}
            />
          ))}
        </div>
      )}
    </>
  );
}
