"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { uploadClientFile } from "@/lib/storage";
import {
  addReviewVersion,
  addReviewComment,
  toggleCommentResolved,
  setVersionStatus,
} from "@/modules/review/actions";

type Version = {
  id: string;
  version: number;
  storagePath: string;
  status: "in_review" | "changes_requested" | "approved";
  createdAt: string;
};

type Comment = {
  id: string;
  body: string;
  timestampSeconds: number | null;
  resolved: boolean;
  authorName: string;
  createdAt: string;
};

const statusChip: Record<Version["status"], { label: string; cls: string }> = {
  in_review: { label: "In Review", cls: "text-[#8db4d9] border-[#8db4d9]/40" },
  changes_requested: { label: "Changes Requested", cls: "text-[#d98a7a] border-[#d98a7a]/40" },
  approved: { label: "Approved", cls: "text-[#8ec98e] border-[#8ec98e]/40" },
};

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function ReviewRoom({
  isAdmin,
  deliverable,
  versions,
  activeVersionId,
  comments,
}: {
  isAdmin: boolean;
  deliverable: { id: string; title: string; clientId: string };
  versions: Version[];
  activeVersionId: string | null;
  comments: Comment[];
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState("");
  const [draft, setDraft] = useState("");
  const [atTime, setAtTime] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();

  const active = versions.find((x) => x.id === activeVersionId) ?? null;

  // Signed playback URL (4h) — generated with the viewer's own session, so RLS applies
  useEffect(() => {
    let cancelled = false;
    setVideoUrl(null);
    setVideoError("");
    if (!active) return;
    (async () => {
      const supabase = createSupabaseBrowser();
      const { data, error } = await supabase.storage
        .from("deliverables")
        .createSignedUrl(active.storagePath, 60 * 60 * 4);
      if (cancelled) return;
      if (error || !data) setVideoError("Could not load the video — please refresh or contact the studio.");
      else setVideoUrl(data.signedUrl);
    })();
    return () => {
      cancelled = true;
    };
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const seek = (t: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = t;
      videoRef.current.play().catch(() => {});
    }
  };

  const postComment = () => {
    if (!active || !draft.trim()) return;
    startTransition(async () => {
      const res = await addReviewComment({
        versionId: active.id,
        deliverableId: deliverable.id,
        body: draft,
        timestampSeconds: atTime ? Math.round(currentTime * 100) / 100 : null,
      });
      setMsg(res.message);
      if (res.ok) {
        setDraft("");
        router.refresh();
      }
    });
  };

  const uploadVersion = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMsg("Choose a video file first.");
      return;
    }
    startTransition(async () => {
      setMsg("Uploading video — this can take a minute…");
      const { path, error } = await uploadClientFile("deliverables", deliverable.clientId, file, `review/${deliverable.id}`);
      if (error || !path) {
        setMsg(`Upload failed: ${error}`);
        return;
      }
      const res = await addReviewVersion({ deliverableId: deliverable.id, storagePath: path });
      setMsg(res.message);
      if (res.ok) {
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      }
    });
  };

  const decide = (status: "approved" | "changes_requested") => {
    if (!active) return;
    if (status === "approved" && !confirm("Approve this version? The studio will move to final delivery.")) return;
    startTransition(async () => {
      const res = await setVersionStatus({ versionId: active.id, deliverableId: deliverable.id, status });
      setMsg(res.message);
      router.refresh();
    });
  };

  const openComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap mt-2 mb-6">
        <div>
          <h1 className="font-display text-[1.6rem] font-semibold">{deliverable.title}</h1>
          {active && (
            <span className={`inline-block mt-2 rounded-full border px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] ${statusChip[active.status].cls}`}>
              Version {active.version} — {statusChip[active.status].label}
            </span>
          )}
        </div>
        {versions.length > 1 && (
          <select
            value={active?.version ?? ""}
            onChange={(e) => router.push(`/review/${deliverable.id}?v=${e.target.value}`)}
            aria-label="Switch version"
            className="font-body text-[0.9rem] text-ink bg-surface border border-rule rounded px-3.5 py-2 cursor-pointer focus:outline-none focus:border-accent"
          >
            {versions.map((x) => (
              <option key={x.id} value={x.version}>
                Version {x.version} · {statusChip[x.status].label}
              </option>
            ))}
          </select>
        )}
      </div>

      {!active ? (
        <div className="bg-surface border border-rule rounded-lg p-10 text-center">
          <p className="text-muted">
            {isAdmin
              ? "No review versions yet — upload the first cut below."
              : "The first cut isn't ready yet. You'll see it here (and get an update) the moment it is."}
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
          {/* Player */}
          <div>
            <div className="bg-black rounded-lg overflow-hidden border border-rule">
              {videoError ? (
                <div className="aspect-video flex items-center justify-center text-[#d98a7a] text-[0.9rem] px-6">{videoError}</div>
              ) : !videoUrl ? (
                <div className="aspect-video flex items-center justify-center text-muted text-[0.9rem]">Loading video…</div>
              ) : (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  playsInline
                  className="w-full aspect-video"
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                />
              )}
            </div>

            {/* Decision bar */}
            <div className="flex items-center gap-3 flex-wrap mt-4">
              {active.status !== "approved" && (
                <button
                  disabled={pending}
                  onClick={() => decide("approved")}
                  className="rounded-full bg-[#8ec98e] text-bg border border-[#8ec98e] font-semibold uppercase text-[0.8rem] tracking-[0.08em] px-6 py-2.5 hover:bg-transparent hover:text-[#8ec98e] transition-all disabled:opacity-60 cursor-pointer"
                >
                  ✓ Approve This Version
                </button>
              )}
              {active.status === "in_review" && (
                <button
                  disabled={pending}
                  onClick={() => decide("changes_requested")}
                  className="rounded-full border border-rule text-ink font-semibold uppercase text-[0.8rem] tracking-[0.08em] px-6 py-2.5 hover:border-[#d98a7a] hover:text-[#d98a7a] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  Request Changes
                </button>
              )}
              {msg && <p className="text-muted text-[0.85rem]" role="status">{msg}</p>}
            </div>

            {/* Admin: upload next version */}
            {isAdmin && (
              <div className="mt-6 bg-surface border border-rule rounded-lg p-5">
                <h2 className="font-display text-[1.05rem] font-semibold mb-3">Upload New Version</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="video/*"
                    aria-label="New version video file"
                    className="text-[0.85rem] text-muted file:mr-3 file:rounded-full file:border file:border-rule file:bg-transparent file:text-muted file:px-4 file:py-1.5 file:text-[0.78rem] file:cursor-pointer"
                  />
                  <button
                    disabled={pending}
                    onClick={uploadVersion}
                    className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 hover:bg-transparent hover:text-accent transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {pending ? "Working…" : `Upload Version ${(versions[0]?.version ?? 0) + 1}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Comment rail */}
          <aside className="bg-surface border border-rule rounded-lg p-5 lg:sticky lg:top-6">
            <h2 className="font-display text-[1.15rem] font-semibold mb-4">
              Feedback {openComments.length > 0 && <span className="text-accent">({openComments.length} open)</span>}
            </h2>

            <div className="grid gap-2.5 mb-5">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                placeholder="What should change? Be specific — timestamps help."
                className="w-full font-body text-[0.9rem] text-ink bg-bg border border-rule rounded px-3.5 py-2.5 resize-y focus:outline-none focus:border-accent"
              />
              <label className="flex items-center gap-2 text-[0.82rem] text-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={atTime}
                  onChange={(e) => setAtTime(e.target.checked)}
                  className="accent-[var(--color-accent)] w-4 h-4"
                />
                Pin to current time ({fmtTime(currentTime)})
              </label>
              <button
                disabled={pending || !draft.trim()}
                onClick={postComment}
                className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 hover:bg-transparent hover:text-accent transition-all disabled:opacity-50 cursor-pointer justify-self-start"
              >
                Post Comment
              </button>
            </div>

            {comments.length === 0 && (
              <p className="text-muted text-[0.88rem]">No feedback yet on this version.</p>
            )}

            <ul className="space-y-3">
              {openComments.map((c) => (
                <CommentCard key={c.id} c={c} isAdmin={isAdmin} deliverableId={deliverable.id} onSeek={seek} pending={pending} startTransition={startTransition} router={router} />
              ))}
            </ul>

            {resolvedComments.length > 0 && (
              <details className="mt-5">
                <summary className="text-muted text-[0.82rem] cursor-pointer">
                  {resolvedComments.length} resolved
                </summary>
                <ul className="space-y-3 mt-3 opacity-60">
                  {resolvedComments.map((c) => (
                    <CommentCard key={c.id} c={c} isAdmin={isAdmin} deliverableId={deliverable.id} onSeek={seek} pending={pending} startTransition={startTransition} router={router} />
                  ))}
                </ul>
              </details>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function CommentCard({
  c,
  isAdmin,
  deliverableId,
  onSeek,
  pending,
  startTransition,
  router,
}: {
  c: Comment;
  isAdmin: boolean;
  deliverableId: string;
  onSeek: (t: number) => void;
  pending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
  router: { refresh: () => void };
}) {
  return (
    <li className="border border-rule rounded-md p-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.8rem] font-semibold">{c.authorName}</span>
        {c.timestampSeconds != null && (
          <button
            onClick={() => onSeek(c.timestampSeconds!)}
            className="rounded bg-accent-soft text-accent text-[0.78rem] font-semibold px-2 py-0.5 tabular-nums hover:bg-accent hover:text-bg transition-colors cursor-pointer"
            aria-label={`Jump to ${fmtTime(c.timestampSeconds)}`}
          >
            ▶ {fmtTime(c.timestampSeconds)}
          </button>
        )}
      </div>
      <p className="text-[0.88rem] text-ink/90 mt-1.5 whitespace-pre-wrap">{c.body}</p>
      <div className="flex items-center justify-between gap-3 mt-2">
        <span className="text-[0.72rem] text-muted">
          {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        {isAdmin && (
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await toggleCommentResolved(c.id, deliverableId, !c.resolved);
                router.refresh();
              })
            }
            className="text-[0.75rem] text-muted hover:text-accent transition-colors cursor-pointer"
          >
            {c.resolved ? "Reopen" : "Mark resolved"}
          </button>
        )}
      </div>
    </li>
  );
}
