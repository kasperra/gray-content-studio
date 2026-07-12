"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PLATFORMS,
  POST_STATUSES,
  tightestLimit,
  type PostStatus,
} from "@/modules/social/platforms";
import {
  saveSocialPost,
  setSocialPostStatus,
  deleteSocialPost,
} from "@/modules/social/actions";

export type WorkspacePost = {
  id: string;
  platforms: string[];
  caption: string;
  hashtags: string;
  mediaPaths: string[];
  scheduledFor: string | null;
  status: PostStatus;
  createdAt: string;
};

export type WorkspaceTemplate = { id: string; kind: string; name: string; body: string };
export type WorkspaceAsset = { name: string; storagePath: string };

const fieldCls =
  "w-full font-body text-[0.92rem] text-ink bg-bg border border-rule rounded px-3.5 py-2.5 focus:outline-none focus:border-accent transition-colors";
const labelCls = "text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted";

const statusColor: Record<PostStatus, string> = {
  draft: "text-muted border-rule",
  scheduled: "text-[#8db4d9] border-[#8db4d9]/40",
  published: "text-[#8ec98e] border-[#8ec98e]/40",
  archived: "text-muted/60 border-rule",
};

const empty = {
  platforms: [] as string[],
  caption: "",
  hashtags: "",
  mediaPaths: [] as string[],
  scheduledFor: "",
  status: "draft" as PostStatus,
};

export function SocialWorkspace({
  clientId,
  posts,
  templates,
  assets,
}: {
  clientId: string;
  posts: WorkspacePost[];
  templates: WorkspaceTemplate[];
  assets: WorkspaceAsset[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [showEditor, setShowEditor] = useState(false);
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();

  const limit = tightestLimit(form.platforms);
  const captionLen = form.caption.length + (form.hashtags ? form.hashtags.length + 2 : 0);
  const overLimit = limit != null && captionLen > limit.limit;

  const grouped = useMemo(() => {
    const byStatus: Record<PostStatus, WorkspacePost[]> = { scheduled: [], draft: [], published: [], archived: [] };
    for (const p of posts) byStatus[p.status]?.push(p);
    byStatus.scheduled.sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""));
    return byStatus;
  }, [posts]);

  const openEditor = (post?: WorkspacePost) => {
    if (post) {
      setEditingId(post.id);
      setForm({
        platforms: post.platforms,
        caption: post.caption,
        hashtags: post.hashtags,
        mediaPaths: post.mediaPaths,
        scheduledFor: post.scheduledFor ? post.scheduledFor.slice(0, 16) : "",
        status: post.status,
      });
    } else {
      setEditingId(null);
      setForm(empty);
    }
    setMsg("");
    setShowEditor(true);
  };

  const save = () => {
    startTransition(async () => {
      const res = await saveSocialPost(
        {
          clientId,
          platforms: form.platforms,
          caption: form.caption,
          hashtags: form.hashtags,
          mediaPaths: form.mediaPaths,
          scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : null,
          status: form.status,
        },
        editingId ?? undefined
      );
      setMsg(res.message);
      if (res.ok) {
        setShowEditor(false);
        router.refresh();
      }
    });
  };

  const exportText = (post: WorkspacePost) => {
    const platforms = post.platforms.map((id) => PLATFORMS.find((p) => p.id === id)?.label ?? id).join(", ");
    return [
      `Platforms: ${platforms || "—"}`,
      post.scheduledFor ? `Scheduled: ${new Date(post.scheduledFor).toLocaleString()}` : null,
      "",
      post.caption,
      "",
      post.hashtags,
      post.mediaPaths.length ? `\nMedia: ${post.mediaPaths.join(", ")}` : null,
    ]
      .filter((x) => x != null)
      .join("\n");
  };

  const copyPost = async (post: WorkspacePost) => {
    try {
      await navigator.clipboard.writeText(`${post.caption}\n\n${post.hashtags}`.trim());
      setMsg("Caption + hashtags copied.");
    } catch {
      prompt("Copy the caption:", `${post.caption}\n\n${post.hashtags}`.trim());
    }
  };

  const downloadPost = (post: WorkspacePost) => {
    const blob = new Blob([exportText(post)], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `post-${(post.scheduledFor ?? post.createdAt).slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <p className="text-muted text-[0.88rem] max-w-136">
          Plan posts, store captions and hashtags, and export ready-to-publish content. Publishing
          stays in your hands — nothing posts automatically.
        </p>
        <button
          onClick={() => openEditor()}
          className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 hover:bg-transparent hover:text-accent transition-all cursor-pointer"
        >
          + New Post
        </button>
      </div>

      {msg && !showEditor && <p className="text-[#8ec98e] text-[0.88rem] mb-4" role="status">{msg}</p>}

      {/* Editor */}
      {showEditor && (
        <div className="bg-surface border border-accent/40 rounded-lg p-6 mb-8">
          <h2 className="font-display text-[1.2rem] font-semibold mb-4">
            {editingId ? "Edit Post" : "New Post"}
          </h2>
          <div className="grid gap-4">
            <div>
              <p className={labelCls}>Platforms</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {PLATFORMS.map((p) => {
                  const on = form.platforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        setForm({
                          ...form,
                          platforms: on ? form.platforms.filter((x) => x !== p.id) : [...form.platforms, p.id],
                        })
                      }
                      className={`rounded-full border px-3.5 py-1.5 text-[0.8rem] font-medium transition-colors cursor-pointer ${
                        on ? "bg-accent text-bg border-accent" : "border-rule text-muted hover:text-ink"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {templates.length > 0 && (
              <div className="grid gap-1.5">
                <label htmlFor="sw-template" className={labelCls}>Start from template</label>
                <select
                  id="sw-template"
                  defaultValue=""
                  onChange={(e) => {
                    const t = templates.find((x) => x.id === e.target.value);
                    if (t) setForm({ ...form, caption: t.body });
                    e.target.value = "";
                  }}
                  className={fieldCls}
                >
                  <option value="">Insert a template…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.kind.replace("_", " ")}] {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid gap-1.5">
              <div className="flex justify-between items-baseline">
                <label htmlFor="sw-caption" className={labelCls}>Caption</label>
                {limit && (
                  <span className={`text-[0.75rem] tabular-nums ${overLimit ? "text-[#d98a7a] font-semibold" : "text-muted"}`}>
                    {captionLen}/{limit.limit} ({limit.platform} limit)
                  </span>
                )}
              </div>
              <textarea
                id="sw-caption"
                rows={5}
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                placeholder="Write the post…"
                className={`${fieldCls} resize-y`}
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="sw-hashtags" className={labelCls}>Hashtags</label>
              <input
                id="sw-hashtags"
                value={form.hashtags}
                onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
                placeholder="#videoproduction #richmondva"
                className={fieldCls}
              />
            </div>

            {assets.length > 0 && (
              <details>
                <summary className={`${labelCls} cursor-pointer`}>
                  Attach media from asset library ({form.mediaPaths.length} selected)
                </summary>
                <div className="flex flex-wrap gap-2 mt-3">
                  {assets.map((a) => {
                    const on = form.mediaPaths.includes(a.storagePath);
                    return (
                      <button
                        key={a.storagePath}
                        onClick={() =>
                          setForm({
                            ...form,
                            mediaPaths: on
                              ? form.mediaPaths.filter((x) => x !== a.storagePath)
                              : [...form.mediaPaths, a.storagePath],
                          })
                        }
                        className={`rounded-full border px-3 py-1 text-[0.75rem] transition-colors cursor-pointer ${
                          on ? "bg-accent-soft text-accent border-accent/50" : "border-rule text-muted hover:text-ink"
                        }`}
                      >
                        {a.name}
                      </button>
                    );
                  })}
                </div>
              </details>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="sw-when" className={labelCls}>Scheduled for</label>
                <input
                  id="sw-when"
                  type="datetime-local"
                  value={form.scheduledFor}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      scheduledFor: e.target.value,
                      status: e.target.value && form.status === "draft" ? "scheduled" : form.status,
                    })
                  }
                  className={fieldCls}
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="sw-status" className={labelCls}>Status</label>
                <select
                  id="sw-status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as PostStatus })}
                  className={fieldCls}
                >
                  {POST_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {msg && <p className="text-[#d98a7a] text-[0.85rem]" role="status">{msg}</p>}

            <div className="flex gap-3">
              <button
                disabled={pending}
                onClick={save}
                className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 hover:bg-transparent hover:text-accent transition-all disabled:opacity-60 cursor-pointer"
              >
                {pending ? "Saving…" : editingId ? "Update Post" : "Save Post"}
              </button>
              <button
                onClick={() => setShowEditor(false)}
                className="rounded-full border border-rule text-muted font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 hover:text-ink transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Planner */}
      {posts.length === 0 && !showEditor && (
        <p className="text-muted">No posts yet — plan your first one.</p>
      )}

      {(["scheduled", "draft", "published", "archived"] as PostStatus[]).map((status) => {
        const list = grouped[status];
        if (!list.length) return null;
        return (
          <section key={status} className="mb-8">
            <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-accent mb-3">
              {status} ({list.length})
            </h2>
            <div className="space-y-3">
              {list.map((post) => (
                <article key={post.id} className="bg-surface border border-rule rounded-lg p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {post.platforms.map((id) => (
                          <span key={id} className="rounded-full bg-accent-soft text-accent text-[0.7rem] font-semibold px-2.5 py-0.5">
                            {PLATFORMS.find((p) => p.id === id)?.label ?? id}
                          </span>
                        ))}
                        {post.scheduledFor && (
                          <span className="text-muted text-[0.78rem]">
                            📅 {new Date(post.scheduledFor).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      <p className="text-[0.92rem] text-ink/90 whitespace-pre-wrap line-clamp-3">{post.caption || "—"}</p>
                      {post.hashtags && <p className="text-accent/80 text-[0.82rem] mt-1.5 break-words">{post.hashtags}</p>}
                      {post.mediaPaths.length > 0 && (
                        <p className="text-muted text-[0.75rem] mt-1.5">{post.mediaPaths.length} media file{post.mediaPaths.length === 1 ? "" : "s"} attached</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={post.status}
                        disabled={pending}
                        onChange={(e) => startTransition(async () => {
                          await setSocialPostStatus(post.id, e.target.value as PostStatus);
                          router.refresh();
                        })}
                        aria-label="Post status"
                        className={`rounded-full border bg-transparent text-[0.7rem] font-semibold uppercase tracking-[0.08em] px-2.5 py-1 cursor-pointer ${statusColor[post.status]}`}
                      >
                        {POST_STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-surface text-ink">{s}</option>
                        ))}
                      </select>
                      <button onClick={() => openEditor(post)} className="rounded border border-rule text-[0.75rem] px-2.5 py-1 text-muted hover:text-accent hover:border-accent transition-colors cursor-pointer">Edit</button>
                      <button onClick={() => copyPost(post)} className="rounded border border-rule text-[0.75rem] px-2.5 py-1 text-muted hover:text-accent hover:border-accent transition-colors cursor-pointer">Copy</button>
                      <button onClick={() => downloadPost(post)} className="rounded border border-rule text-[0.75rem] px-2.5 py-1 text-muted hover:text-accent hover:border-accent transition-colors cursor-pointer">Export</button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this post?"))
                            startTransition(async () => {
                              await deleteSocialPost(post.id);
                              router.refresh();
                            });
                        }}
                        className="rounded border border-rule text-[0.75rem] px-2.5 py-1 text-muted hover:text-[#d98a7a] hover:border-[#d98a7a] transition-colors cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
