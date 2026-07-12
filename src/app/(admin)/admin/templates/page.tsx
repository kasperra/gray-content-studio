import { createSupabaseServer } from "@/lib/supabase/server";
import { TemplateManager } from "./TemplateManager";

export default async function TemplatesPage() {
  const supabase = await createSupabaseServer();
  const [{ data: templates }, { data: clients }] = await Promise.all([
    supabase
      .from("content_templates")
      .select("id, kind, name, body, client_id")
      .order("kind")
      .order("name"),
    supabase.from("clients").select("id, company").order("company"),
  ]);

  return (
    <>
      <h1 className="font-display text-[1.6rem] font-semibold mb-2">Content Templates</h1>
      <p className="text-muted text-[0.9rem] mb-6 max-w-136">
        Reusable starting points for reels, posts, blogs, newsletters, and captions. Studio-wide
        templates are available to every client&apos;s workspace; client-specific ones only to theirs.
      </p>
      <TemplateManager
        templates={(templates ?? []).map((t) => ({
          id: t.id,
          kind: t.kind,
          name: t.name,
          body: t.body,
          clientId: t.client_id,
        }))}
        clients={(clients ?? []).map((c) => ({ id: c.id, company: c.company }))}
      />
    </>
  );
}
