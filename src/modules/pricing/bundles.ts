/* Package presets — the three public bundles (see PACKAGES in content/site.ts)
   expressed as rate-card selections so a package can be loaded into the public
   calculator or the admin proposal builder in one click.

   Each preset is the MINIMUM configuration of its package, so the loaded
   estimate lands at the "from" price the card advertises. A visitor who clicks
   "from $3,800" must not land on a materially bigger number.

   Two rules keep that true:
   1. Content-package line items (brandstory, commercial, testimonial…) are
      all-inclusive deliverables — they already cover their own production and
      standard edit. Never stack a shoot day or edit hours on top of them.
   2. Ranges quoted on the card ("4–8 reels") load at the low end.

   bundles.test.ts asserts every preset stays within 10% of its floor. */

export type Bundle = {
  id: string;
  name: string;
  /** Marketing floor shown on the package card. */
  from: string;
  /** Same figure as a number, so tests can assert the preset matches it. */
  floor: number;
  tagline: string;
  /** service id -> qty */
  selections: Record<string, number>;
  /** Prefills the proposal's scope notes. */
  notes: string;
};

/** The social deliverables every tier carries, at the low end of "4–8". */
const SOCIAL_LAYER: Record<string, number> = {
  reeledit: 4, // platform-native reels/shorts cut from the shoot
  captions: 4,
  vertical: 4,
  thumbnail: 4,
};

/** starterstrat is the entry-tier planning session, so it stays scoped to this
    package. The higher tiers do their creative planning through their own,
    heavier line items (Campaign Engine bills a Creative Strategy Session at
    $250) — carrying this one up would put two strategy sessions on the same
    proposal. */
const SOCIAL_STARTER: Record<string, number> = {
  starterstrat: 1, // strategy session that opens the engagement
  videohalf: 1, // half-day videography shoot
  ...SOCIAL_LAYER,
};

/** Brand Builder = "Everything in Social Starter" + the brand film.
    brandstory is an all-inclusive deliverable, so it replaces the shoot day
    rather than adding to it; lighting/audio and the premium finish are the
    extras the card calls out. */
const BRAND_BUILDER: Record<string, number> = {
  ...SOCIAL_LAYER,
  brandstory: 1, // brand story video (2–3 min), production included
  lighting: 1,
  audio: 1,
  colorgrade: 1,
  motion: 2,
  shortform: 4, // cutdowns for social, low end of 4–8
  export4k: 1, // 4K masters
};

/** Campaign Engine = "Everything in Brand Builder" + the commercial campaign.
    commercial and testimonial are likewise all-inclusive deliverables. */
const CAMPAIGN_ENGINE: Record<string, number> = {
  ...BRAND_BUILDER,
  commercial: 1, // 30–60 sec commercial, production included
  creative: 1, // creative strategy
  script: 1,
  storyboard: 1,
  drone: 1, // multi-day production incl. drone
  testimonial: 1, // testimonial cutdown
};

export const BUNDLES: Bundle[] = [
  {
    id: "social-starter",
    name: "Social Starter",
    from: "from $1,400",
    floor: 1400,
    tagline: "A month of scroll-stopping short-form content.",
    selections: SOCIAL_STARTER,
    notes:
      "A month of platform-native short-form content: one half-day shoot cut into reels sized and captioned for each platform, with thumbnails ready to post.",
  },
  {
    id: "brand-builder",
    name: "Brand Builder",
    from: "from $3,800",
    floor: 3800,
    tagline: "The film that defines how customers see you.",
    selections: BRAND_BUILDER,
    notes:
      "Everything in Social Starter plus the brand story film: a full production day with lighting and audio, finished with color grade and motion graphics, delivered as 4K masters with social cutdowns.",
  },
  {
    id: "campaign-engine",
    name: "Campaign Engine",
    from: "from $6,500",
    floor: 6500,
    tagline: "A full commercial campaign, concept to distribution.",
    selections: CAMPAIGN_ENGINE,
    notes:
      "Everything in Brand Builder plus a full commercial campaign: creative strategy, script and storyboard, multi-day production including drone, and a 30–60 second commercial with platform variants and testimonial cutdowns.",
  },
];

export function getBundle(id: string): Bundle | undefined {
  return BUNDLES.find((b) => b.id === id);
}
