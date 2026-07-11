"use client";

import { useRef, useState, useTransition } from "react";
import { STAGES, stageIndex, type StageId } from "@/modules/projects/stages";
import {
  updateProjectStage,
  addDeliverable,
  setDeliverableStatus,
  deleteDeliverable,
  addDocument,
} from "@/modules/projects/actions";
import { uploadClientFile, getDownloadUrl } from "@/lib/storage";

type Deliverable = {
  id: string;
  title: string;
  status: "pending" | "in_review" | "approved" | "delivered";
  storagePath: string | null;
};

const fieldCls =
  "w-full font-body text-[0.95rem] text-ink bg-bg border border-rule rounded px-3.5 py-2.5 focus:outline-none focus:border-accent transition-colors";

const DELIVERABLE_STATUSES: Deliverable["status"][] = ["pending", "in_review", "approved", "delivered"];

export function ProjectManager({
  project,
  deliverables,
  activities,
}: {
  project: { id: string; title: string; stage: string; description: string | null; dueDate: string | null; clientId: string };
  deliverables: Deliverable[];
  activities: { body: string; createdAt: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [uploadMsg, setUploadMsg] = useState("");
  const [docMsg, setDocMsg] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const docFileRef = useRef<HTMLInputElement>(null);
  const [docKind, setDocKind] = useState<"contract" | "invoice">("contract");
  const [docTitle, setDocTitle] = useState("");
  const [docAmount, setDocAmount] = useState("");

  const currentIdx = stageIndex(project.stage);

  const handleAddDeliverable = () => {
    const file = fileRef.current?.files?.[0] ?? null;
    if (!newTitle.trim()) {
      setUploadMsg("Give the deliverable a title first.");
      return;
    }
    startTransition(async () => {
      let storagePath: string | null = null;
      if (file) {
        setUploadMsg("Uploading…");
        const { path, error } = await uploadClientFile("deliverables", project.clientId, file, project.id);
        if (error) {
          setUploadMsg(`Upload failed: ${error}`);
          return;
        }
        storagePath = path;
      }
      const res = await addDeliverable({ projectId: project.id, title: newTitle, storagePath });
      setUploadMsg(res.message);
      if (res.ok) {
        setNewTitle("");
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  };

  const handleAddDocument = () => {
    const file = docFileRef.current?.files?.[0] ?? null;
    if (!docTitle.trim()) {
      setDocMsg(docKind === "contract" ? "Give the contract a title." : "Give the invoice a number.");
      return;
    }
    if (docKind === "contract" && !file) {
      setDocMsg("Choose a contract file to upload.");
      return;
    }
    startTransition(async () => {
      let storagePath = "";
      if (file) {
        setDocMsg("Uploading…");
        const { path, error } = await uploadClientFile("documents", project.clientId, file, docKind);
        if (error) {
          setDocMsg(`Upload failed: ${error}`);
          return;
        }
        storagePath = path!;
      }
      const res = await addDocument({
        clientId: project.clientId,
        projectId: project.id,
        kind: docKind,
        title: docTitle,
        storagePath,
        amount: parseFloat(docAmount) || 0,
      });
      setDocMsg(res.message);
      if (res.ok) {
        setDocTitle("");
        setDocAmount("");
        if (docFileRef.current) docFileRef.current.value = "";
      }
    });
  };

  const download = async (path: string) => {
    const url = await getDownloadUrl("deliverables", path);
    if (url) window.open(url, "_blank");
  };

  return (
    <>
      <div className="flex items-start justify-between gap-6 flex-wrap mt-2">
        <div>
          <h1 className="font-display text-[1.8rem] font-semibold">{project.title}</h1>
          {project.dueDate && <p className="text-muted text-[0.88rem] mt-1">Due {project.dueDate}</p>}
        </div>
        <div className="grid gap-1">
          <label htmlFor="stage-select" className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted">
            Stage
          </label>
          <select
            id="stage-select"
            value={project.stage}
            disabled={pending}
            onChange={(e) => startTransition(() => updateProjectStage(project.id, e.target.value as StageId))}
            className={`${fieldCls} min-w-52 cursor-pointer`}
          >
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pipeline visual */}
      <ol className="flex flex-wrap gap-1.5 mt-6" aria-label="Production pipeline progress">
        {STAGES.map((s, i) => (
          <li
            key={s.id}
            className={`text-[0.68rem] font-semibold uppercase tracking-[0.1em] rounded-full px-3 py-1.5 border ${
              i < currentIdx
                ? "border-accent/40 text-accent/70 bg-accent-soft"
                : i === currentIdx
                  ? "border-accent text-bg bg-accent"
                  : "border-rule text-muted"
            }`}
          >
            {s.label}
          </li>
        ))}
      </ol>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        {/* Deliverables */}
        <section className="bg-surface border border-rule rounded-lg p-6">
          <h2 className="font-display text-[1.2rem] font-semibold mb-4">Deliverables</h2>
          {!deliverables.length ? (
            <p className="text-muted text-[0.9rem] mb-4">Nothing here yet.</p>
          ) : (
            <ul className="space-y-3 mb-5">
              {deliverables.map((d) => (
                <li key={d.id} className="border border-rule rounded-md px-4 py-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="font-medium text-[0.95rem]">{d.title}</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={d.status}
                        disabled={pending}
                        onChange={(e) =>
                          startTransition(() =>
                            setDeliverableStatus(d.id, project.id, e.target.value as Deliverable["status"])
                          )
                        }
                        aria-label={`Status of ${d.title}`}
                        className="rounded-full border border-rule bg-transparent text-[0.72rem] font-semibold uppercase tracking-[0.1em] px-3 py-1 text-muted cursor-pointer"
                      >
                        {DELIVERABLE_STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-surface text-ink">{s.replace("_", " ")}</option>
                        ))}
                      </select>
                      {d.storagePath && (
                        <button
                          onClick={() => download(d.storagePath!)}
                          className="rounded border border-rule text-[0.78rem] px-3 py-1 text-muted hover:text-accent hover:border-accent transition-colors cursor-pointer"
                        >
                          Download
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm("Delete this deliverable (and its file)?"))
                            startTransition(() => deleteDeliverable(d.id, project.id));
                        }}
                        className="rounded border border-rule text-[0.78rem] px-3 py-1 text-muted hover:text-[#d98a7a] hover:border-[#d98a7a] transition-colors cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="grid gap-3 border-t border-rule pt-4">
            <input
              className={fieldCls}
              placeholder="Deliverable title (e.g. Brand Film — First Cut)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <input ref={fileRef} type="file" className="text-[0.85rem] text-muted file:mr-3 file:rounded-full file:border file:border-rule file:bg-transparent file:text-muted file:px-4 file:py-1.5 file:text-[0.78rem] file:cursor-pointer" aria-label="Deliverable file" />
            <button
              disabled={pending}
              onClick={handleAddDeliverable}
              className="rounded-full bg-accent text-bg border border-accent font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 transition-all hover:bg-transparent hover:text-accent disabled:opacity-60 cursor-pointer justify-self-start"
            >
              {pending ? "Working…" : "Add Deliverable"}
            </button>
            {uploadMsg && <p className="text-[0.85rem] text-muted" role="status">{uploadMsg}</p>}
          </div>
        </section>

        <div className="space-y-6">
          {/* Documents */}
          <section className="bg-surface border border-rule rounded-lg p-6">
            <h2 className="font-display text-[1.2rem] font-semibold mb-4">Add Contract / Invoice</h2>
            <div className="grid gap-3">
              <div className="flex gap-2">
                {(["contract", "invoice"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setDocKind(k)}
                    className={`rounded-full border px-4 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.1em] cursor-pointer transition-colors ${
                      docKind === k ? "bg-accent text-bg border-accent" : "border-rule text-muted hover:text-ink"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <input
                className={fieldCls}
                placeholder={docKind === "contract" ? "Contract title" : "Invoice number (e.g. INV-001)"}
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
              />
              {docKind === "invoice" && (
                <input
                  className={fieldCls}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Amount ($)"
                  value={docAmount}
                  onChange={(e) => setDocAmount(e.target.value)}
                />
              )}
              <input ref={docFileRef} type="file" className="text-[0.85rem] text-muted file:mr-3 file:rounded-full file:border file:border-rule file:bg-transparent file:text-muted file:px-4 file:py-1.5 file:text-[0.78rem] file:cursor-pointer" aria-label="Document file" />
              <button
                disabled={pending}
                onClick={handleAddDocument}
                className="rounded-full border border-rule text-ink font-semibold uppercase text-[0.78rem] tracking-[0.08em] px-5 py-2 hover:border-accent hover:text-accent transition-colors disabled:opacity-60 cursor-pointer justify-self-start"
              >
                Save {docKind}
              </button>
              {docMsg && <p className="text-[0.85rem] text-muted" role="status">{docMsg}</p>}
            </div>
          </section>

          {/* Activity */}
          <section className="bg-surface border border-rule rounded-lg p-6">
            <h2 className="font-display text-[1.2rem] font-semibold mb-4">Activity</h2>
            {!activities.length ? (
              <p className="text-muted text-[0.9rem]">No activity yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {activities.map((a, i) => (
                  <li key={i} className="text-[0.88rem] text-muted flex gap-3">
                    <span className="text-accent shrink-0">·</span>
                    <span>
                      {a.body}
                      <span className="block text-[0.75rem] opacity-70">
                        {new Date(a.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
