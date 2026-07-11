"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { AssetKind } from "./kinds";

function refresh(clientId: string) {
  revalidatePath("/admin/assets");
  revalidatePath("/portal/assets");
  revalidatePath(`/admin/clients/${clientId}`);
}

export async function createFolder(input: {
  clientId: string;
  name: string;
}): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!input.name.trim()) return { ok: false, message: "Folder needs a name." };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("asset_folders").insert({
    client_id: input.clientId,
    name: input.name.trim(),
  });
  if (error) return { ok: false, message: "Could not create the folder." };
  refresh(input.clientId);
  return { ok: true, message: "Folder created." };
}

export async function deleteFolder(folderId: string, clientId: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  const { count } = await supabase
    .from("assets")
    .select("id", { count: "exact", head: true })
    .eq("folder_id", folderId);
  if (count && count > 0)
    return { ok: false, message: "Folder isn't empty — move or delete its assets first." };
  await supabase.from("asset_folders").delete().eq("id", folderId);
  refresh(clientId);
  return { ok: true, message: "Folder deleted." };
}

export async function addAssetRecord(input: {
  clientId: string;
  folderId: string | null;
  name: string;
  kind: AssetKind;
  storagePath: string;
  tags: string[];
  versionOf?: string | null;
}): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("assets").insert({
    client_id: input.clientId,
    folder_id: input.folderId,
    name: input.name,
    kind: input.kind,
    storage_path: input.storagePath,
    tags: input.tags,
    version_of: input.versionOf ?? null,
  });
  if (error) return { ok: false, message: "Could not save the asset record." };
  refresh(input.clientId);
  return { ok: true, message: "Asset added." };
}

export async function updateAssetTags(assetId: string, clientId: string, tags: string[]) {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  await supabase
    .from("assets")
    .update({ tags: tags.map((t) => t.trim()).filter(Boolean) })
    .eq("id", assetId);
  refresh(clientId);
}

export async function deleteAsset(assetId: string, clientId: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const supabase = await createSupabaseServer();
  const { data: asset } = await supabase
    .from("assets")
    .select("storage_path")
    .eq("id", assetId)
    .single();
  if (asset?.storage_path) {
    await supabase.storage.from("assets").remove([asset.storage_path]);
  }
  // Older versions chained to this asset are preserved; unlink them
  await supabase.from("assets").update({ version_of: null }).eq("version_of", assetId);
  await supabase.from("assets").delete().eq("id", assetId);
  refresh(clientId);
  return { ok: true, message: "Asset deleted." };
}
