import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { SocialWorkspace } from "@/components/SocialWorkspace";
import type { PostStatus } from "@/modules/social/platforms";

export default async function AdminSocialPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client: clientParam } = await searchParams;
  const supabase = await createSupabaseServer();

  const { data: clients } = await supabase.from("clients").select("id, company").order("company");
  const selectedClient = clients?.find((c) => c.id === clientParam) ?? clients?.[0] ?? null;

  if (!selectedClient) {
    return (
      <>
        <h1 className="font-display text-[1.6rem] font-semibold mb-4">Social Workspace</h1>
        <p className="text-muted">
          No clients yet — create one under <Link href="/admin/clients" className="text-accent hover:underline">Clients</Link> first.
        </p>
      </>
    );
  }

  const [{ data: posts }, { data: templates }, { data: assets }] = await Promise.all([
    supabase
      .from("social_posts")
      .select("*")
      .eq("client_id", selectedClient.id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("content_templates")
      .select("id, kind, name, body")
      .or(`client_id.is.null,client_id.eq.${selectedClient.id}`)
      .order("name"),
    supabase
      .from("assets")
      .select("name, storage_path")
      .eq("client_id", selectedClient.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h1 className="font-display text-[1.6rem] font-semibold">Social Workspace</h1>
        <form>
          <select
            name="client"
            defaultValue={selectedClient.id}
            aria-label="Select client"
            className="font-body text-[0.9rem] text-ink bg-surface border border-rule rounded px-3.5 py-2 cursor-pointer focus:outline-none focus:border-accent"
          >
            {(clients ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.company}</option>
            ))}
          </select>
          <button type="submit" className="ml-2 rounded-full border border-rule text-muted text-[0.8rem] font-semibold uppercase tracking-[0.08em] px-4 py-2 hover:text-accent hover:border-accent transition-colors cursor-pointer">
            Switch
          </button>
        </form>
      </div>

      <SocialWorkspace
        clientId={selectedClient.id}
        posts={(posts ?? []).map((p) => ({
          id: p.id,
          platforms: p.platforms ?? [],
          caption: p.caption ?? "",
          hashtags: p.hashtags ?? "",
          mediaPaths: p.media_paths ?? [],
          scheduledFor: p.scheduled_for,
          status: p.status as PostStatus,
          createdAt: p.created_at,
        }))}
        templates={(templates ?? []).map((t) => ({ id: t.id, kind: t.kind, name: t.name, body: t.body }))}
        assets={(assets ?? []).map((a) => ({ name: a.name, storagePath: a.storage_path }))}
      />
    </>
  );
}
