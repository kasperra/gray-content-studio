import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Wordmark } from "@/components/Nav";
import { SignOutButton } from "../SignOutButton";
import { AssetGrid } from "@/components/AssetGrid";

export const metadata: Metadata = {
  title: "Asset Library — Client Portal",
  robots: { index: false, follow: false },
};

export default async function PortalAssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const session = await requireUser();
  const { folder: folderParam } = await searchParams;
  const supabase = await createSupabaseServer();

  // RLS scopes both queries to the client's own rows
  const [{ data: folders }, { data: assets }] = await Promise.all([
    supabase.from("asset_folders").select("id, name").order("name"),
    supabase
      .from("assets")
      .select("id, name, kind, storage_path, tags, created_at, version_of, folder_id, client_id")
      .order("created_at", { ascending: false }),
  ]);

  const activeFolder = folders?.find((f) => f.id === folderParam) ?? null;
  const visible = (assets ?? []).filter((a) =>
    activeFolder ? a.folder_id === activeFolder.id : a.folder_id === null
  );

  return (
    <main className="min-h-svh">
      <header className="h-[76px] flex items-center border-b border-rule">
        <div className="w-[min(1200px,92vw)] mx-auto flex items-center justify-between gap-6">
          <Wordmark />
          <div className="flex items-center gap-5">
            <span className="text-muted text-[0.85rem] hidden sm:inline">{session.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="w-[min(1200px,92vw)] mx-auto py-12">
        <Link href="/portal" className="text-muted text-[0.85rem] hover:text-ink transition-colors">
          ← Dashboard
        </Link>
        <h1 className="font-display font-semibold text-[clamp(1.8rem,4vw,2.6rem)] mt-2 mb-2">Your Asset Library</h1>
        <p className="text-muted text-[0.95rem] mb-8 max-w-136">
          Everything we&apos;ve produced for you — searchable, tagged, and always downloadable.
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Link
            href="/portal/assets"
            className={`rounded-full border px-4 py-1.5 text-[0.82rem] font-medium transition-colors ${
              !activeFolder ? "bg-accent text-bg border-accent" : "border-rule text-muted hover:text-ink"
            }`}
          >
            All Files
          </Link>
          {(folders ?? []).map((f) => (
            <Link
              key={f.id}
              href={`/portal/assets?folder=${f.id}`}
              className={`rounded-full border px-4 py-1.5 text-[0.82rem] font-medium transition-colors ${
                activeFolder?.id === f.id ? "bg-accent text-bg border-accent" : "border-rule text-muted hover:text-ink"
              }`}
            >
              📁 {f.name}
            </Link>
          ))}
        </div>

        <AssetGrid
          assets={visible.map((a) => ({
            id: a.id,
            name: a.name,
            kind: a.kind,
            storagePath: a.storage_path,
            tags: a.tags ?? [],
            createdAt: a.created_at,
            versionOf: a.version_of,
          }))}
          isAdmin={false}
          clientId={session.clientId ?? ""}
        />
      </div>
    </main>
  );
}
