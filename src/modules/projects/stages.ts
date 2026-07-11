/* The production pipeline — order matters (index = progress). */

export const STAGES = [
  { id: "lead", label: "Lead" },
  { id: "proposal", label: "Proposal" },
  { id: "contract", label: "Contract" },
  { id: "deposit", label: "Deposit" },
  { id: "pre_production", label: "Pre-Production" },
  { id: "production", label: "Production" },
  { id: "editing", label: "Editing" },
  { id: "review", label: "Review" },
  { id: "revisions", label: "Revisions" },
  { id: "approval", label: "Approval" },
  { id: "delivery", label: "Delivery" },
  { id: "completed", label: "Completed" },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

export function stageIndex(id: string): number {
  return Math.max(0, STAGES.findIndex((s) => s.id === id));
}

export function stageLabel(id: string): string {
  return STAGES.find((s) => s.id === id)?.label ?? id;
}
