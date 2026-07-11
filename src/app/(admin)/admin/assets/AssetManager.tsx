"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadClientFile } from "@/lib/storage";
import { createFolder, deleteFolder, addAssetRecord } from "@/modules/assets/actions";
import { kindFromMime } from "@/modules/assets/kinds";
import { AssetGrid, type AssetItem } from "@/components/AssetGrid";

export function AssetManager({
  clientId,
  clientCompany,
  folders,
  activeFolderId,
  assets,
}: {
  clientId: string;
  clientCompany: string;
  folders: { id: string; name: string }[];
  activeFolderId: string | null;
  assets: AssetItem[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [newFolder, setNewFolder] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();

  const folderHref = (folderId: string | null) =>
    `/admin/assets?client=${clientId}${folderId ? `&folder=${folderId}` : ""}`;

  const upload = () => {
    const files = [...(fileRef.current?.files ?? [])];
    if (!files.length) {
      setMsg("Choose one or more files first.");
      return;
    }
    startTransition(async () => {
      let done = 0;
      for (const file of files) {
        setMsg(`Uploading ${done + 1}/${files.length}: ${file.name}…`);
        const { path, error } = await uploadClientFile("assets", clientId, file, activeFolderId ?? "root");
        if (error || !path) {
          setMsg(`Upload failed on ${file.name}: ${error}`);
          return;
        }
        const res = await addAssetRecord({
          clientId,
          folderId: activeFolderId,
          name: file.name,
          kind: kindFromMime(file.type),
          storagePath: path,
          tags: [],
        });
        if (!res.ok) {
          setMsg(res.message);
          return;
        }
        done++;
      }
      setMsg(`${done} file${done === 1 ? "" : "s"} uploaded.`);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  };

  return (
    <>
      {/* Folder nav */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <a
          href={folderHref(null)}
          className={`rounded-full border px-4 py-1.5 text-[0.82rem] font-medium transition-colors ${
            !activeFolderId ? "bg-accent text-bg border-accent" : "border-rule text-muted hover:text-ink"
          }`}
        >
          {clientCompany} — All Files
        </a>
        {folders.map((f) => (
          <span key={f.id} className="inline-flex items-center">
            <a
              href={folderHref(f.id)}
              className={`rounded-full border px-4 py-1.5 text-[0.82rem] font-medium transition-colors ${
                activeFolderId === f.id ? "bg-accent text-bg border-accent" : "border-rule text-muted hover:text-ink"
              }`}
            >
              📁 {f.name}
            </a>
            {activeFolderId === f.id && (
              <button
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await deleteFolder(f.id, clientId);
                    setMsg(res.message);
                    if (res.ok) router.push(folderHref(null));
                  })
                }
                aria-label={`Delete folder ${f.name}`}
                className="ml-1 text-muted hover:text-[#d98a7a] text-[0.8rem] cursor-pointer"
              >
                ✕
              </button>
            )}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <input
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newFolder.trim()) {
                startTransition(async () => {
                  const res = await createFolder({ clientId, name: newFolder });
                  setMsg(res.message);
                  if (res.ok) setNewFolder("");
                  router.refresh();
                });
              }
            }}
            placeholder="+ New folder"
            aria-label="New folder name"
            className="w-32 font-body text-[0.82rem] text-ink bg-surface border border-rule rounded-full px-3.5 py-1.5 focus:outline-none focus:border-accent"
          />
        </span>
      </div>

      {/* Upload */}
      <div className="bg-surface border border-rule rounded-lg p-5 mb-8 flex items-center gap-4 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          multiple
          aria-label="Files to upload"
          className="text-[0.85rem] text-muted file:mr-3 file:rounded-full file:border file:border-rule file:bg-transparent file:text-muted file:px-4 file:py-1.5 file:text-[0.78rem] file:cursor-pointer"
        />
        <button
          disabled={pending}
          onClick={upload}
          className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 hover:bg-transparent hover:text-accent transition-all disabled:opacity-60 cursor-pointer"
        >
          {pending ? "Working…" : `Upload to ${activeFolderId ? folders.find((f) => f.id === activeFolderId)?.name : "All Files"}`}
        </button>
        {msg && <p className="text-muted text-[0.85rem]" role="status">{msg}</p>}
      </div>

      <AssetGrid assets={assets} isAdmin clientId={clientId} />
    </>
  );
}
