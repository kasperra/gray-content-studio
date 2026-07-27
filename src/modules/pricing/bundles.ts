/* Package presets — the three public bundles (see PACKAGES in content/site.ts)
   expressed as rate-card selections so a proposal can be built in one click.

   Quantities are starting points that mirror each bundle's bullet list; the
   admin tunes them in the builder. Totals are always recomputed server-side by
   computeEstimate(), so these are inputs, never trusted prices. */

export type Bundle = {
  id: string;
  name: string;
  /** Marketing floor shown on /pricing — for reference, not used in math. */
  from: string;
  tagline: string;
  /** service id -> qty */
  selections: Record<string, number>;
  /** Prefills the proposal's scope notes. */
  notes: string;
};

/** Deliverables every bundle carries (Social Starter's social layer). */
const SOCIAL_LAYER: Record<string, number> = {
  reeledit: 4, // platform-native reels/shorts
  captions: 4,
  vertical: 4,
  thumbnail: 4,
};

const SOCIAL_STARTER: Record<string, number> = {
  consult: 1,
  videohalf: 1, // half-day videography shoot
  ...SOCIAL_LAYER,
};

/** Brand Builder = "Everything in Social Starter" + the brand film. */
const BRAND_BUILDER: Record<string, number> = {
  ...SOCIAL_STARTER,
  videohalf: 0, // superseded by the full production day below
  branddisc: 1,
  script: 1,
  videofull: 1,
  lighting: 1,
  audio: 1,
  brandstory: 1, // brand story video (2–3 min)
  advedit: 4,
  colorgrade: 1,
  motion: 2,
  music: 1,
  shortform: 4, // cutdowns for social
  export4k: 1, // 4K masters
};

/** Campaign Engine = "Everything in Brand Builder" + the commercial campaign. */
const CAMPAIGN_ENGINE: Record<string, number> = {
  ...BRAND_BUILDER,
  creative: 1,
  campaign: 1,
  advscript: 1,
  storyboard: 1,
  shotlist: 1,
  videofull: 2, // multi-day production
  secondcam: 1,
  drone: 1,
  commercial: 1, // 30–60 sec commercial
  advedit: 8,
  motion: 4,
  sounddesign: 1,
  testimonial: 2, // testimonial cutdowns
  shortform: 8, // platform variants / ad versions
};

/** Drop zero-qty carry-overs so they don't show as empty rows. */
function clean(sel: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(sel).filter(([, qty]) => qty > 0));
}

export const BUNDLES: Bundle[] = [
  {
    id: "social-starter",
    name: "Social Starter",
    from: "from $1,400",
    tagline: "A month of scroll-stopping short-form content.",
    selections: clean(SOCIAL_STARTER),
    notes:
      "A month of platform-native short-form content: one half-day shoot cut into reels sized and captioned for each platform, with thumbnails ready to post.",
  },
  {
    id: "brand-builder",
    name: "Brand Builder",
    from: "from $3,800",
    tagline: "The film that defines how customers see you.",
    selections: clean(BRAND_BUILDER),
    notes:
      "Everything in Social Starter plus the brand story film: a full production day with lighting and audio, advanced edit with color grade and motion graphics, delivered as 4K masters with social cutdowns.",
  },
  {
    id: "campaign-engine",
    name: "Campaign Engine",
    from: "from $6,500",
    tagline: "A full commercial campaign, concept to distribution.",
    selections: clean(CAMPAIGN_ENGINE),
    notes:
      "Everything in Brand Builder plus a full commercial campaign: creative strategy, script and storyboard, multi-day production including drone, and a 30–60 second commercial with platform variants, testimonial cutdowns, and ad versions.",
  },
];

export function getBundle(id: string): Bundle | undefined {
  return BUNDLES.find((b) => b.id === id);
}
