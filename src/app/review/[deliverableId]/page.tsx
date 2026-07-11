import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { Wordmark } from "@/components/Nav";
import { SignOutButton } from "@/app/(portal)/portal/SignOutButton";
import { ReviewRoom } from "./ReviewRoom";

export const metadata: Metadata = {
  title: "Review Room",
  robots: { index: false, follow: false },
};

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ deliverableId: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const session = await requireUser();
  const { deliverableId } = await params;
  const { v } = await searchParams;
  const supabase = await createSupabaseServer();

  // RLS scopes this to the caller (client sees only own projects)
  const { data: deliverable } = await supabase
    .from("deliverables")
    .select("id, title, status, project_id, projects(id, title, client_id)")
    .eq("id", deliverableId)
    .single();
  if (!deliverable) notFound();

  const { data: versions } = await supabase
    .from("review_versions")
    .select("id, version, storage_path, status, created_at")
    .eq("deliverable_id", deliverableId)
    .order("version", { ascending: false });

  const activeVersion =
    (v && versions?.find((x) => String(x.version) === v)) || versions?.[0] || null;

  // Comments + author names (names via service role after the RLS-scoped access check above)
  let comments: {
    id: string;
    body: string;
    timestampSeconds: number | null;
    resolved: boolean;
    authorName: string;
    createdAt: string;
  }[] = [];
  if (activeVersion) {
    const admin = createSupabaseAdmin();
    const { data: rows } = await admin
      .from("review_comments")
      .select("id, body, timestamp_seconds, resolved, created_at, author")
      .eq("version_id", activeVersion.id)
      .order("timestamp_seconds", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    const authorIds = [...new Set((rows ?? []).map((r) => r.author).filter(Boolean))] as string[];
    const { data: authors } = authorIds.length
      ? await admin.from("profiles").select("id, name, role").in("id", authorIds)
      : { data: [] };
    comments = (rows ?? []).map((r) => {
      const author = authors?.find((a) => a.id === r.author);
      return {
        id: r.id,
        body: r.body,
        timestampSeconds: r.timestamp_seconds != null ? Number(r.timestamp_seconds) : null,
        resolved: r.resolved,
        authorName: author?.name || (author?.role === "admin" ? "Gray Content Studio" : "Client"),
        createdAt: r.created_at,
      };
    });
  }

  const project = deliverable.projects as unknown as { id: string; title: string } | null;
  const backHref = session.role === "admin" ? `/admin/projects/${deliverable.project_id}` : `/portal/projects/${deliverable.project_id}`;

  return (
    <main className="min-h-svh">
      <header className="h-[76px] flex items-center border-b border-rule">
        <div className="w-[min(1400px,94vw)] mx-auto flex items-center justify-between gap-6">
          <Wordmark />
          <div className="flex items-center gap-5">
            <span className="text-muted text-[0.85rem] hidden sm:inline">{session.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="w-[min(1400px,94vw)] mx-auto py-8">
        <Link href={backHref} className="text-muted text-[0.85rem] hover:text-ink transition-colors">
          ← {project?.title ?? "Back"}
        </Link>
        <ReviewRoom
          isAdmin={session.role === "admin"}
          deliverable={{ id: deliverable.id, title: deliverable.title, clientId: (deliverable.projects as unknown as { client_id: string } | null)?.client_id ?? "" }}
          versions={(versions ?? []).map((x) => ({
            id: x.id,
            version: x.version,
            storagePath: x.storage_path,
            status: x.status,
            createdAt: x.created_at,
          }))}
          activeVersionId={activeVersion?.id ?? null}
          comments={comments}
        />
      </div>
    </main>
  );
}
