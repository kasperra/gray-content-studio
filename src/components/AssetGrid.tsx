"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { getDownloadUrl } from "@/lib/storage";
import { KIND_ICONS, type AssetKind } from "@/modules/assets/kinds";
import { updateAssetTags, deleteAsset } from "@/modules/assets/actions";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export type AssetItem = {
  id: string;
  name: string;
  kind: AssetKind;
  storagePath: string;
  tags: string[];
  createdAt: string;
  versionOf: string | null;
};

export function AssetGrid({
  assets,
  isAdmin,
  clientId,
}: {
  assets: AssetItem[];
  isAdmin: boolean;
  clientId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [pending, startTransition] = useTransition();

  // Signed thumbnails for images
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createSupabaseBrowser();
      const images = assets.filter((a) => (a.kind === "photo" || a.kind === "logo" || a.kind === "graphic") && !thumbs[a.id]);
      if (!images.length) return;
      const { data } = await supabase.storage
        .from("assets")
        .createSignedUrls(images.map((a) => a.storagePath), 60 * 60);
      if (cancelled || !data) return;
      const next: Record<string, string> = {};
      data.forEach((d, i) => {
        if (d.signedUrl) next[images[i].id] = d.signedUrl;
      });
      setThumbs((t) => ({ ...t, ...next }));
    })();
    return () => {
      cancelled = true;
    };
  }, [assets]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = query.toLowerCase().trim();
  const visible = useMemo(
    () =>
      assets.filter(
        (a) =>
          !q ||
          a.name.toLowerCase().includes(q) ||
          a.kind.includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      ),
    [assets, q]
  );

  const download = async (a: AssetItem) => {
    setBusy(a.id);
    try {
      const url = await getDownloadUrl("assets", a.storagePath);
      if (url) window.open(url, "_blank");
    } finally {
      setBusy(null);
    }
  };

  const saveTags = (a: AssetItem) => {
    startTransition(async () => {
      await updateAssetTags(a.id, clientId, tagDraft.split(",").map((t) => t.trim()).filter(Boolean));
      setEditingTags(null);
      router.refresh();
    });
  };

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, tag, or type…"
        aria-label="Search assets"
        className="w-full max-w-96 font-body text-[0.95rem] text-ink bg-surface border border-rule rounded px-4 py-2.5 mb-6 focus:outline-none focus:border-accent transition-colors"
      />

      {visible.length === 0 && (
        <p className="text-muted text-[0.9rem]">
          {assets.length === 0 ? "Nothing in this folder yet." : "No assets match your search."}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {visible.map((a) => (
          <article key={a.id} className="bg-surface border border-rule rounded-lg overflow-hidden flex flex-col">
            <div className="aspect-video bg-bg flex items-center justify-center overflow-hidden">
              {thumbs[a.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbs[a.id]} alt={a.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[2rem] text-muted" aria-hidden="true">
                  {KIND_ICONS[a.kind]}
                </span>
              )}
            </div>
            <div className="p-3.5 flex flex-col grow">
              <p className="text-[0.88rem] font-medium break-words">{a.name}</p>
              <p className="text-muted text-[0.72rem] uppercase tracking-[0.12em] font-semibold mt-1">
                {a.kind}
                {a.versionOf && " · new version"}
              </p>
              {editingTags === a.id ? (
                <div className="flex gap-1.5 mt-2">
                  <input
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveTags(a)}
                    placeholder="tag1, tag2"
                    className="w-full font-body text-[0.78rem] text-ink bg-bg border border-accent rounded px-2 py-1 focus:outline-none"
                  />
                  <button
                    disabled={pending}
                    onClick={() => saveTags(a)}
                    className="text-[0.75rem] text-accent cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                a.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {a.tags.map((t) => (
                      <button
                        key={t}
                        onClick={() => setQuery(t)}
                        className="rounded-full bg-accent-soft text-accent text-[0.7rem] px-2 py-0.5 cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )
              )}
              <div className="flex items-center gap-2 mt-auto pt-3">
                <button
                  onClick={() => download(a)}
                  disabled={busy === a.id}
                  className="rounded-full bg-accent text-bg border border-accent text-[0.72rem] font-semibold uppercase tracking-[0.06em] px-3.5 py-1.5 hover:bg-transparent hover:text-accent transition-all disabled:opacity-60 cursor-pointer"
                >
                  {busy === a.id ? "…" : "Download"}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingTags(editingTags === a.id ? null : a.id);
                      setTagDraft(a.tags.join(", "));
                    }}
                    className="rounded border border-rule text-[0.72rem] px-2.5 py-1.5 text-muted hover:text-accent hover:border-accent transition-colors cursor-pointer"
                  >
                    Tags
                  </button>
                )}
                <ConfirmDeleteButton
                  action={deleteAsset}
                  args={[a.id, clientId]}
                  itemName={a.name}
                  variant="inline"
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
