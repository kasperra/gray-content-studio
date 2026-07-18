import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { PortalHeader } from "../PortalHeader";
import { SocialWorkspace } from "@/components/SocialWorkspace";
import type { PostStatus } from "@/modules/social/platforms";

export const metadata: Metadata = {
  title: "Social Workspace — Client Portal",
  robots: { index: false, follow: false },
};

export default async function PortalSocialPage() {
  const session = await requireUser();
  const supabase = await createSupabaseServer();

  // RLS scopes everything to the client's own rows (templates include studio-wide)
  const [{ data: posts }, { data: templates }, { data: assets }] = await Promise.all([
    supabase.from("social_posts").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("content_templates").select("id, kind, name, body").order("name"),
    supabase.from("assets").select("name, storage_path").order("created_at", { ascending: false }).limit(100),
  ]);

  return (
    <main className="min-h-svh">
      <PortalHeader email={session.email} />

      <div className="w-[min(1200px,92vw)] mx-auto py-12">
        <Link href="/portal" className="text-muted text-[0.85rem] hover:text-ink transition-colors">
          ← Dashboard
        </Link>
        <h1 className="font-display font-semibold text-[clamp(1.8rem,4vw,2.6rem)] mt-2 mb-8">
          Social Workspace
        </h1>

        <SocialWorkspace
          clientId={session.clientId ?? ""}
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
      </div>
    </main>
  );
}
