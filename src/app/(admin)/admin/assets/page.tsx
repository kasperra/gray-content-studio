import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AssetManager } from "./AssetManager";

export default async function AdminAssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; folder?: string }>;
}) {
  const { client: clientParam, folder: folderParam } = await searchParams;
  const supabase = await createSupabaseServer();

  const { data: clients } = await supabase.from("clients").select("id, company").order("company");
  const selectedClient = clients?.find((c) => c.id === clientParam) ?? clients?.[0] ?? null;

  if (!selectedClient) {
    return (
      <>
        <h1 className="font-display text-[1.6rem] font-semibold mb-4">Asset Library</h1>
        <p className="text-muted">
          No clients yet — create one under <Link href="/admin/clients" className="text-accent hover:underline">Clients</Link> first.
        </p>
      </>
    );
  }

  const [{ data: folders }, { data: assets }] = await Promise.all([
    supabase.from("asset_folders").select("id, name").eq("client_id", selectedClient.id).order("name"),
    supabase
      .from("assets")
      .select("id, name, kind, storage_path, tags, created_at, version_of, folder_id")
      .eq("client_id", selectedClient.id)
      .order("created_at", { ascending: false }),
  ]);

  const activeFolder = folders?.find((f) => f.id === folderParam) ?? null;
  const folderAssets = (assets ?? []).filter((a) =>
    activeFolder ? a.folder_id === activeFolder.id : a.folder_id === null
  );

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h1 className="font-display text-[1.6rem] font-semibold">Asset Library</h1>
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

      <AssetManager
        clientId={selectedClient.id}
        clientCompany={selectedClient.company}
        folders={(folders ?? []).map((f) => ({ id: f.id, name: f.name }))}
        activeFolderId={activeFolder?.id ?? null}
        assets={folderAssets.map((a) => ({
          id: a.id,
          name: a.name,
          kind: a.kind,
          storagePath: a.storage_path,
          tags: a.tags ?? [],
          createdAt: a.created_at,
          versionOf: a.version_of,
        }))}
      />
    </>
  );
}
