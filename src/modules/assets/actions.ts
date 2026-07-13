"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, requireUser } from "@/lib/auth";
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
  // Admins delete any folder; clients may delete folders under their own client_id.
  const session = await requireUser();
  if (session.role !== "admin" && session.clientId !== clientId) {
    return { ok: false, message: "Not allowed." };
  }
  const db = createSupabaseAdmin();
  const { data: folder } = await db.from("asset_folders").select("client_id").eq("id", folderId).single();
  if (!folder) return { ok: false, message: "Folder not found." };
  if (session.role !== "admin" && folder.client_id !== session.clientId) {
    return { ok: false, message: "Not allowed." };
  }
  const { count } = await db
    .from("assets")
    .select("id", { count: "exact", head: true })
    .eq("folder_id", folderId);
  if (count && count > 0)
    return { ok: false, message: "Folder isn't empty — move or delete its assets first." };
  await db.from("asset_folders").delete().eq("id", folderId);
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
  // Admins delete any asset; clients may delete assets under their own client_id.
  const session = await requireUser();
  if (session.role !== "admin" && session.clientId !== clientId) {
    return { ok: false, message: "Not allowed." };
  }
  const db = createSupabaseAdmin();
  const { data: asset } = await db
    .from("assets")
    .select("storage_path, client_id")
    .eq("id", assetId)
    .single();
  if (!asset) return { ok: false, message: "Asset not found." };
  if (session.role !== "admin" && asset.client_id !== session.clientId) {
    return { ok: false, message: "Not allowed." };
  }
  if (asset.storage_path) {
    await db.storage.from("assets").remove([asset.storage_path]);
  }
  // Older versions chained to this asset are preserved; unlink them
  await db.from("assets").update({ version_of: null }).eq("version_of", assetId);
  await db.from("assets").delete().eq("id", assetId);
  refresh(clientId);
  return { ok: true, message: "Asset deleted." };
}
