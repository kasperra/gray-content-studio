/* Content Growth Diagnostic — shared types.
   Kept free of React and Supabase imports so the scoring engine can run in a
   plain node process (see scoring.test.ts). */

export const DIMENSIONS = [
  "visibility",
  "strategy",
  "production",
  "distribution",
  "conversion",
  "measurement",
] as const;

export type Dimension = (typeof DIMENSIONS)[number];

export const DIMENSION_LABELS: Record<Dimension, string> = {
  visibility: "Visibility",
  strategy: "Strategy",
  production: "Production",
  distribution: "Distribution",
  conversion: "Conversion",
  measurement: "Measurement",
};

/** Points an answer contributes, per dimension. */
export type Scores = Partial<Record<Dimension, number>>;

export type Option = {
  id: string;
  label: string;
  /** Optional one-line clarifier under the label. */
  hint?: string;
  scores?: Scores;
};

export type Question = {
  id: string;
  /** Grouping shown in the progress rail. */
  section: "Context" | "Content" | "Strategy" | "Distribution" | "Conversion" | "Measurement" | "Intent";
  prompt: string;
  /** Short supporting line under the prompt. */
  help?: string;
  options: Option[];
  /** Highest points any option awards, per dimension. Doubles as the question's
      weight: a question with max 5 moves a dimension more than one with max 2.
      Only questions actually asked count toward the denominator, so skipping an
      adaptive question never distorts the percentage. */
  max?: Scores;
  /** Adaptive gate. Omitted means always ask. */
  showIf?: (answers: Answers) => boolean;
  /** Context questions that segment the lead without scoring. */
  meta?: "business_type" | "frustration" | "intent" | "urgency";
};

export type Answers = Record<string, string>;

export type StageId = 1 | 2 | 3 | 4 | 5;

export type Stage = {
  id: StageId;
  name: string;
  /** One-line positioning shown under the stage name. */
  positioning: string;
  /** The dimension this stage is defined by failing to clear. */
  bottleneck: Dimension | "optimization";
  objective: string;
  /** Result headline, e.g. "Your Content Isn't Your Biggest Problem…" */
  headline: string;
  /** What must change to reach the next stage. */
  nextStageRequirement: string;
  cta: string;
};

export type Result = {
  scores: Record<Dimension, number>;
  overall: number;
  stage: StageId;
  primaryBottleneck: Dimension;
  secondaryBottlenecks: Dimension[];
  /** Why this stage — built from the answers actually given. */
  reasons: string[];
  roadmap: RoadmapItem[];
  plan30: { week: number; title: string; detail: string }[];
  purchaseIntent: string;
  urgency: string;
  businessType: string;
};

export type RoadmapItem = {
  dimension: Dimension;
  title: string;
  detail: string;
};
