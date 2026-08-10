import type { Dimension, Stage, StageId } from "./types";

/* Diagnostic copy. Everything here describes content operations in general —
   nothing claims a fact about the visitor's business, and nothing invents a
   Gray service, price, client, or statistic. */

export const STAGES: Stage[] = [
  {
    id: 1,
    name: "Invisible",
    positioning: "Your business isn't consistently getting discovered through content.",
    bottleneck: "visibility",
    objective: "Build a content foundation.",
    headline: "You Don't Have a Content Problem Yet. You Have a Visibility Problem.",
    nextStageRequirement:
      "Publish consistently enough that content becomes a channel people actually find you through — a repeatable cadence you can hold for a quarter without heroics.",
    cta: "Build My Content Foundation",
  },
  {
    id: 2,
    name: "Active",
    positioning: "You're creating content, but it isn't running on a system.",
    bottleneck: "strategy",
    objective: "Create a repeatable content strategy and production system.",
    headline: "You're Publishing. You're Just Not Publishing Toward Anything.",
    nextStageRequirement:
      "Move from reactive publishing to a documented strategy: defined audience, defined objectives, and a content architecture that decides what gets made before the week starts.",
    cta: "Build My Content Strategy",
  },
  {
    id: 3,
    name: "Strategic",
    positioning: "You have content and strategy, but attention isn't becoming business.",
    bottleneck: "conversion",
    objective: "Connect content to measurable business outcomes.",
    headline: "Your Content Isn't Your Biggest Problem. Your Conversion System Is.",
    nextStageRequirement:
      "Build deliberate pathways from content to inquiry, and measurement that shows which pieces produced them — so you can tell working content from popular content.",
    cta: "Fix My Content-to-Conversion Gap",
  },
  {
    id: 4,
    name: "Growth",
    positioning: "The content works. The operation behind it needs to scale.",
    bottleneck: "production",
    objective: "Build a scalable content operation.",
    headline: "Your Content Works. Your Production System Is the Ceiling.",
    nextStageRequirement:
      "Turn a working approach into an operation: repeatable production, systematic repurposing across channels, and measurement that closes the loop on what to make next.",
    cta: "Scale My Content Engine",
  },
  {
    id: 5,
    name: "Content Engine",
    positioning: "Content is a genuine growth asset. The work now is leverage.",
    bottleneck: "optimization",
    objective: "Increase efficiency, performance, and business impact.",
    headline: "Your Content Is an Asset. Now It's About Leverage.",
    nextStageRequirement:
      "You've cleared the structural gates. Growth now comes from compounding what already works — sharper testing, higher-leverage formats, and cutting the production cost of every result.",
    cta: "Optimize My Content Growth System",
  },
];

export const BOTTLENECK_COPY: Record<Dimension, { label: string; what: string; cost: string }> = {
  visibility: {
    label: "Visibility",
    what: "Potential customers aren't reliably discovering you through content.",
    cost: "Until discovery works, every other content improvement is being made for an audience that isn't there yet.",
  },
  strategy: {
    label: "Strategy",
    what: "Content is being made, but not from a plan that connects it to business objectives.",
    cost: "Without a strategy, output is expensive and results are accidental — you can't repeat a win you can't explain.",
  },
  production: {
    label: "Production",
    what: "You can't consistently produce the volume or quality your plan requires.",
    cost: "Production becomes the ceiling on growth: the strategy is sound, but the operation can't feed it.",
  },
  distribution: {
    label: "Distribution",
    what: "Content isn't reaching the audience or lifespan it could.",
    cost: "Every piece stops earning almost immediately, so you pay full production cost for a fraction of the return.",
  },
  conversion: {
    label: "Conversion",
    what: "Content earns attention, but attention isn't turning into inquiries, bookings, or sales.",
    cost: "This is the most expensive gap to leave open — you're already paying to create the audience you aren't converting.",
  },
  measurement: {
    label: "Measurement",
    what: "You can't tell which content is producing business results.",
    cost: "Without measurement, you can't double down on what works or stop what doesn't — so budget spreads evenly across both.",
  },
};

/** Roadmap entries. `core` for earlier stages, `advanced` once the fundamentals
    are in place, so a Stage 4 business isn't told to do Stage 1 work. */
export const ROADMAP_LIBRARY: Record<Dimension, { title: string; core: string; advanced: string }> = {
  visibility: {
    title: "Visibility",
    core: "Establish a publishing cadence you can hold, on the one channel where your customers already are.",
    advanced: "Expand into adjacent channels and search surfaces so discovery doesn't depend on a single algorithm.",
  },
  strategy: {
    title: "Content Architecture",
    core: "Define your audience, your core message, and the handful of content themes that support them.",
    advanced: "Tie every content theme to a specific business objective and retire the themes that serve none.",
  },
  production: {
    title: "Production System",
    core: "Batch production so a single session yields several weeks of content instead of one post.",
    advanced: "Systematise production — templates, workflows, and roles — so volume no longer depends on any one person.",
  },
  distribution: {
    title: "Distribution & Repurposing",
    core: "Turn each strong idea into multiple pieces sized for the platforms you're already on.",
    advanced: "Build a repurposing pipeline that continuously re-cuts and re-promotes proven work across every channel.",
  },
  conversion: {
    title: "Conversion Pathways",
    core: "Give every piece of content one clear next step — a specific place to go and reason to go there.",
    advanced: "Design and test conversion pathways per content type, so each format has a measured route to inquiry.",
  },
  measurement: {
    title: "Measurement",
    core: "Track the handful of numbers that indicate business impact, not just views and likes.",
    advanced: "Attribute inquiries and revenue back to content, and let that data decide the next production cycle.",
  },
};

/** A 30-day plan built from the stage and the gating bottleneck. Week 1 always
    addresses the bottleneck directly; the rest sequence the supporting work. */
export function plan30For(stage: StageId, primary: Dimension) {
  const week1: Record<Dimension, { title: string; detail: string }> = {
    visibility: {
      title: "Pick one channel and commit",
      detail: "Choose the single channel your customers already use and set a cadence you can hold for 90 days.",
    },
    strategy: {
      title: "Write the strategy down",
      detail: "Define who you're for, what you want them to do, and the three to five themes that get you there.",
    },
    production: {
      title: "Audit your production capacity",
      detail: "Map what you can realistically produce per month, then design the plan around that number.",
    },
    distribution: {
      title: "Inventory what already works",
      detail: "Find your best-performing pieces from the last year — these are the raw material for repurposing.",
    },
    conversion: {
      title: "Map the path to inquiry",
      detail: "Trace what someone must do to go from seeing a post to contacting you, and count the steps.",
    },
    measurement: {
      title: "Define what success means",
      detail: "Pick the two or three business outcomes content should produce, and how you'll observe them.",
    },
  };

  const later: Record<Dimension, { title: string; detail: string }[]> = {
    visibility: [
      { title: "Build a four-week content bank", detail: "Produce a month of content in one batch so the cadence survives a busy week." },
      { title: "Publish consistently", detail: "Hold the schedule without exception — consistency is the variable being tested." },
      { title: "Review and adjust", detail: "Look at what earned attention and let it shape the next month's themes." },
    ],
    strategy: [
      { title: "Build the content architecture", detail: "Turn each theme into repeatable formats you can produce on schedule." },
      { title: "Plan a month against objectives", detail: "Assign every planned piece a job: reach, trust, or inquiry." },
      { title: "Set the review cadence", detail: "Book a monthly review to compare what you planned against what performed." },
    ],
    production: [
      { title: "Batch a month in one session", detail: "Consolidate filming and production so output stops depending on weekly motivation." },
      { title: "Template the repeatable formats", detail: "Standardise your two or three highest-return formats to cut production time." },
      { title: "Remove yourself from a step", detail: "Hand off or systematise the stage that consumes the most of your time." },
    ],
    distribution: [
      { title: "Repurpose your best work", detail: "Turn each proven piece into several platform-native cuts." },
      { title: "Add a distribution channel", detail: "Extend to one more channel with content sized for it, not copied into it." },
      { title: "Systematise re-promotion", detail: "Schedule proven pieces to resurface instead of publishing once and moving on." },
    ],
    conversion: [
      { title: "Build the conversion pathways", detail: "Create the specific destinations your content will point to." },
      { title: "Add a clear next step to every piece", detail: "Give each format one deliberate call to action and use it consistently." },
      { title: "Measure and tighten", detail: "Track which content produces inquiries and cut the steps that lose people." },
    ],
    measurement: [
      { title: "Instrument the basics", detail: "Set up the tracking that connects content to site visits and inquiries." },
      { title: "Attribute your inquiries", detail: "Start asking and recording where new inquiries actually came from." },
      { title: "Let the data pick next month", detail: "Plan the next cycle from what produced business, not what produced likes." },
    ],
  };

  const tail = later[primary];
  return [
    { week: 1, ...week1[primary] },
    { week: 2, ...tail[0] },
    { week: 3, ...tail[1] },
    { week: 4, ...tail[2] },
  ];
}

/** Fallback CTA copy. The admin config layer can override the destination URL. */
export const DEFAULT_BOOKING_URL = "https://www.graycontentstudio.co/#contact";
