import type { Question, Answers } from "./types";

/* The diagnostic instrument.
   Questions probe what the business actually does, not what it wants help with —
   "how does new business find you" separates a referral-dependent shop from one
   with a working funnel; "do you need help with social media" separates nothing.

   Weighting lives in each question's `max`: questions that reveal deeper maturity
   (measurement, repurposing, objective share) carry more points than questions
   that only confirm surface activity. */

const answered = (a: Answers, id: string, ...values: string[]) => values.includes(a[id]);

export const QUESTIONS: Question[] = [
  {
    id: "business_type",
    section: "Context",
    meta: "business_type",
    prompt: "What kind of business are we diagnosing?",
    help: "This shapes which recommendations you get.",
    options: [
      { id: "professional_services", label: "Professional services or consulting" },
      { id: "local", label: "Local or service-area business" },
      { id: "ecommerce", label: "E-commerce or product brand" },
      { id: "startup", label: "Startup or SaaS" },
      { id: "agency", label: "Agency or studio" },
      { id: "personal_brand", label: "Personal brand or creator-led business" },
      { id: "other", label: "Something else" },
    ],
  },
  {
    id: "discovery",
    section: "Context",
    prompt: "How does most of your new business currently find you?",
    help: "Pick the single largest source.",
    max: { visibility: 5 },
    options: [
      { id: "referrals", label: "Referrals and word of mouth", scores: { visibility: 1 } },
      { id: "search", label: "Google or search", scores: { visibility: 5 } },
      { id: "social", label: "Social media", scores: { visibility: 5 } },
      { id: "paid", label: "Paid advertising", scores: { visibility: 3 } },
      { id: "partnerships", label: "Partnerships or outbound", scores: { visibility: 2 } },
      { id: "none", label: "We don't have a reliable source", scores: { visibility: 0 } },
    ],
  },
  {
    id: "frequency",
    section: "Content",
    prompt: "How consistently does your business publish content?",
    max: { production: 5, visibility: 4 },
    options: [
      { id: "never", label: "Almost never", scores: { production: 0, visibility: 0 } },
      { id: "occasionally", label: "Occasionally, when we get to it", scores: { production: 1, visibility: 1 } },
      { id: "weekly", label: "About weekly", scores: { production: 3, visibility: 3 } },
      { id: "multi_weekly", label: "Several times a week", scores: { production: 4, visibility: 4 } },
      { id: "daily", label: "Daily or almost daily", scores: { production: 5, visibility: 4 } },
    ],
  },
  {
    // Adaptive: only asked of businesses that are barely publishing.
    id: "publish_blocker",
    section: "Content",
    prompt: "What's preventing you from publishing consistently?",
    help: "The honest answer, not the polite one.",
    showIf: (a) => answered(a, "frequency", "never", "occasionally"),
    max: { production: 3, strategy: 3 },
    options: [
      { id: "time", label: "Time — it never becomes the priority", scores: { production: 1, strategy: 1 } },
      { id: "ideas", label: "Ideas — we run out of things to say", scores: { production: 1, strategy: 0 } },
      { id: "capacity", label: "Production — filming and editing is the wall", scores: { production: 0, strategy: 2 } },
      { id: "strategy", label: "Strategy — we're not sure what we're building toward", scores: { production: 2, strategy: 0 } },
      { id: "unknown", label: "We don't know what actually works", scores: { production: 2, strategy: 1 } },
    ],
  },
  {
    // Adaptive: high-volume publishers get probed on business impact instead of
    // being asked another frequency question they've already answered.
    id: "attribution",
    section: "Content",
    prompt: "How much of your new business can you attribute to that content?",
    help: "You're publishing consistently — this is the harder question.",
    showIf: (a) => answered(a, "frequency", "multi_weekly", "daily"),
    max: { conversion: 5, measurement: 4 },
    options: [
      { id: "none", label: "Honestly, none that we can point to", scores: { conversion: 0, measurement: 0 } },
      { id: "unclear", label: "Some, but we can't trace it", scores: { conversion: 1, measurement: 1 } },
      { id: "some", label: "A steady trickle of inquiries", scores: { conversion: 3, measurement: 2 } },
      { id: "meaningful", label: "A meaningful share of our pipeline", scores: { conversion: 5, measurement: 4 } },
    ],
  },
  {
    id: "capacity",
    section: "Content",
    prompt: "Can you produce as much content as your plan actually calls for?",
    max: { production: 4 },
    options: [
      { id: "no_plan", label: "We don't have a plan to fall short of", scores: { production: 0 } },
      { id: "well_short", label: "We fall well short of it", scores: { production: 1 } },
      { id: "just_barely", label: "We just barely keep up", scores: { production: 2 } },
      { id: "comfortably", label: "We keep up comfortably", scores: { production: 4 } },
      { id: "headroom", label: "We have headroom to produce more", scores: { production: 4 } },
    ],
  },
  {
    id: "planning",
    section: "Strategy",
    prompt: "How do you decide what to publish?",
    max: { strategy: 5 },
    options: [
      { id: "adhoc", label: "Whatever comes to mind that week", scores: { strategy: 0 } },
      { id: "trends", label: "Trends and what's working elsewhere", scores: { strategy: 1 } },
      { id: "competitors", label: "What competitors are doing", scores: { strategy: 1 } },
      { id: "calendar", label: "A monthly content calendar", scores: { strategy: 3 } },
      { id: "data", label: "Audience and business data", scores: { strategy: 4 } },
      { id: "documented", label: "A documented content strategy", scores: { strategy: 5 } },
    ],
  },
  {
    id: "objective_share",
    section: "Strategy",
    prompt: "How much of your content is created with a specific business objective?",
    help: "Not just a topic — an outcome it's meant to produce.",
    max: { strategy: 5, conversion: 3 },
    options: [
      { id: "almost_none", label: "Almost none", scores: { strategy: 0, conversion: 0 } },
      { id: "some", label: "Some of it", scores: { strategy: 1, conversion: 1 } },
      { id: "half", label: "About half", scores: { strategy: 3, conversion: 1 } },
      { id: "most", label: "Most of it", scores: { strategy: 4, conversion: 2 } },
      { id: "nearly_all", label: "Nearly everything", scores: { strategy: 5, conversion: 3 } },
    ],
  },
  {
    id: "messaging",
    section: "Strategy",
    prompt: "How consistent is your positioning across your content?",
    max: { strategy: 3 },
    options: [
      { id: "shifts", label: "It shifts depending on who's posting", scores: { strategy: 0 } },
      { id: "loose", label: "Roughly consistent, never written down", scores: { strategy: 1 } },
      { id: "documented", label: "Documented and mostly followed", scores: { strategy: 2 } },
      { id: "enforced", label: "Documented, followed, and revisited", scores: { strategy: 3 } },
    ],
  },
  {
    id: "repurposing",
    section: "Distribution",
    prompt: "When a piece of content performs well, what happens next?",
    max: { distribution: 5, production: 2 },
    options: [
      { id: "once", label: "We posted it once and moved on", scores: { distribution: 0, production: 0 } },
      { id: "repost", label: "We repost variations of it", scores: { distribution: 1, production: 1 } },
      { id: "multi_piece", label: "We turn it into several pieces", scores: { distribution: 3, production: 1 } },
      { id: "multi_channel", label: "We push it across multiple channels", scores: { distribution: 4, production: 2 } },
      { id: "system", label: "A system repurposes and re-promotes it", scores: { distribution: 5, production: 2 } },
    ],
  },
  {
    id: "channels",
    section: "Distribution",
    prompt: "How many channels do you actively distribute on?",
    help: "Actively — not accounts that exist but sit idle.",
    max: { distribution: 4 },
    options: [
      { id: "zero", label: "None consistently", scores: { distribution: 0 } },
      { id: "one", label: "One", scores: { distribution: 1 } },
      { id: "two_three", label: "Two or three", scores: { distribution: 3 } },
      { id: "four_plus", label: "Four or more, each with its own cut", scores: { distribution: 4 } },
    ],
  },
  {
    id: "post_view_action",
    section: "Conversion",
    prompt: "What usually happens after someone sees your content?",
    max: { conversion: 5, measurement: 2 },
    options: [
      { id: "nothing", label: "Nothing that we can see", scores: { conversion: 0, measurement: 1 } },
      { id: "follow", label: "They follow us", scores: { conversion: 1, measurement: 1 } },
      { id: "visit", label: "They visit our website", scores: { conversion: 2, measurement: 2 } },
      { id: "contact", label: "They contact us", scores: { conversion: 4, measurement: 2 } },
      { id: "buy", label: "They buy or book", scores: { conversion: 5, measurement: 2 } },
      { id: "unknown", label: "We don't really know", scores: { conversion: 0, measurement: 0 } },
    ],
  },
  {
    id: "conversion_path",
    section: "Conversion",
    prompt: "Is there a clear path from a piece of content to an inquiry?",
    max: { conversion: 5 },
    options: [
      { id: "none", label: "No — people would have to figure it out", scores: { conversion: 0 } },
      { id: "profile", label: "A link in our profile or bio", scores: { conversion: 1 } },
      { id: "sometimes", label: "Sometimes, when we remember a call to action", scores: { conversion: 2 } },
      { id: "most", label: "Most content points somewhere specific", scores: { conversion: 4 } },
      { id: "designed", label: "Deliberate pathways, built and tested", scores: { conversion: 5 } },
    ],
  },
  {
    id: "measurement",
    section: "Measurement",
    prompt: "How do you measure content performance?",
    max: { measurement: 5 },
    options: [
      { id: "none", label: "We don't really track it", scores: { measurement: 0 } },
      { id: "vanity", label: "Views and likes, mostly", scores: { measurement: 1 } },
      { id: "engagement", label: "Engagement and website traffic", scores: { measurement: 2 } },
      { id: "leads", label: "Leads and conversions", scores: { measurement: 4 } },
      { id: "revenue", label: "We know which content contributes to revenue", scores: { measurement: 5 } },
    ],
  },
  {
    id: "testing",
    section: "Measurement",
    prompt: "Do you change what you publish based on what you learn?",
    max: { measurement: 4, distribution: 2 },
    options: [
      { id: "no", label: "Not in any structured way", scores: { measurement: 0, distribution: 0 } },
      { id: "instinct", label: "Informally, on instinct", scores: { measurement: 1, distribution: 1 } },
      { id: "review", label: "We review performance regularly", scores: { measurement: 3, distribution: 1 } },
      { id: "test", label: "We run deliberate tests and act on them", scores: { measurement: 4, distribution: 2 } },
    ],
  },
  {
    id: "frustration",
    section: "Context",
    meta: "frustration",
    prompt: "What's your biggest frustration with content right now?",
    help: "There are no wrong answers — this sharpens your diagnosis.",
    options: [
      { id: "what_to_create", label: "We don't know what to create" },
      { id: "volume", label: "We can't produce enough" },
      { id: "standout", label: "Our content doesn't stand out" },
      { id: "no_customers", label: "We get attention but few customers" },
      { id: "platforms", label: "We can't keep up with multiple platforms" },
      { id: "unknown_working", label: "We don't know what's actually working" },
    ],
  },
  {
    id: "intent",
    section: "Intent",
    meta: "intent",
    prompt: "How seriously are you looking to improve your content?",
    options: [
      { id: "exploring", label: "I'm just exploring" },
      { id: "diy", label: "I'd like to improve it myself" },
      { id: "outside_help", label: "I'm looking for outside help" },
      { id: "partner", label: "I'm actively looking for a content partner" },
      { id: "full_operation", label: "I want someone to take the whole content operation off my plate" },
    ],
  },
  {
    id: "urgency",
    section: "Intent",
    meta: "urgency",
    prompt: "When do you want your content working better?",
    options: [
      { id: "researching", label: "I'm just researching" },
      { id: "six_months", label: "Within the next 6 months" },
      { id: "90_days", label: "Within the next 90 days" },
      { id: "30_days", label: "Within the next 30 days" },
      { id: "asap", label: "As soon as possible" },
    ],
  },
];

/** The questions a given answer set actually surfaces, in order. */
export function visibleQuestions(answers: Answers): Question[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
}

/** Mutually exclusive branches: answering the key opens exactly one of them.
    Listed here so the progress counter can hold steady instead of ticking the
    total up the moment a branch unlocks. */
const BRANCH_GROUPS: { key: string; ids: string[] }[] = [
  { key: "frequency", ids: ["publish_blocker", "attribution"] },
];

/** How many questions this run will ask in total, including branches that
    haven't opened yet. Keeps "3 / 17" from becoming "4 / 18" mid-quiz. */
export function plannedTotal(answers: Answers): number {
  let total = visibleQuestions(answers).length;
  for (const group of BRANCH_GROUPS) {
    const opened = group.ids.filter((id) => visibleQuestions(answers).some((q) => q.id === id)).length;
    // Exactly one of the group will be asked once the key question is answered.
    if (opened === 0) total += 1;
  }
  return total;
}

export function questionById(id: string): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

export function optionLabel(questionId: string, optionId: string): string {
  return questionById(questionId)?.options.find((o) => o.id === optionId)?.label ?? optionId;
}
