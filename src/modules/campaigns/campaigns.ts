/* The seasonal campaigns themselves.

   ── Adding a season ──────────────────────────────────────────────────────
   1. Add an entry below, starting from a theme in CAMPAIGN_THEMES
      (fall · winter · spring · summer · valentines · senior · custom).
   2. Create src/app/(public)/<slug>/page.tsx:

        import { campaignRoute } from "@/modules/campaigns/route";
        const route = campaignRoute("<slug>");
        export const generateMetadata = route.generateMetadata;
        export default route.Page;
        export const revalidate = 300;

   3. Ship it unpublished (`published: false`) and switch it on from
      Admin → Campaigns when the offer is live. Copy, price, CTA and the
      email wording are all editable there afterwards without a deploy.

   Nothing else needs touching: the sitemap, the JSON-LD, the inquiry form,
   both emails and the CRM record all read from the campaign object.

   ── A note on facts ──────────────────────────────────────────────────────
   Dates, locations, spot counts and turnaround times are deliberately absent
   from the copy below. The offer states that dates and locations are confirmed
   when a session is booked, so the page says exactly that and no more. Don't
   add specifics here that the studio hasn't committed to. */

import type { Campaign } from "./campaign";

const FALL_MINI_SESSIONS: Campaign = {
  slug: "fall-mini-sessions",
  published: true,
  themeId: "fall",

  eyebrow: "🍂 Fall Photo Special 📸",
  title: "Fall Mini Sessions",
  price: "$150",
  lede:
    "A short, relaxed outdoor session in the best light of the year — and up to 25 finished photographs you'll actually want to print. Limited spots available this fall.",

  includes: [
    "30-minute session",
    "Up to 25 professionally edited digital photos",
    "Outdoor fall location",
    "Perfect for couples, families, portraits & kids",
    "Online gallery for viewing and downloading",
    "Additional images available for purchase",
    "Limited spots available this fall",
    "Dates and locations confirmed upon booking",
  ],

  highlights: [
    { label: "Session", value: "30 min" },
    { label: "Photos", value: "Up to 25" },
    { label: "Setting", value: "Outdoors" },
  ],

  audience: [
    {
      title: "Families",
      detail:
        "Everyone in one frame, in real light, without the afternoon turning into a production. Thirty minutes is about as long as it stays fun — which is exactly the point.",
    },
    {
      title: "Couples",
      detail:
        "Anniversary, engagement, or no occasion at all. Warm colour, low autumn sun, and photographs of the two of you that don't look staged.",
    },
    {
      title: "Kids",
      detail:
        "Short enough to hold their attention and loose enough to let them be themselves. The best frames are usually the ones between the poses.",
    },
    {
      title: "Portraits",
      detail:
        "A current headshot or a personal portrait with a season behind it — useful far beyond this fall, and a long way from a phone snapshot.",
    },
  ],

  steps: [
    {
      title: "Send your request",
      detail:
        "Fill in the form with your preferred date and the kind of session you're after. It takes about a minute, and it isn't a commitment.",
    },
    {
      title: "We confirm the details",
      detail:
        "Gray Content Studio will contact you to confirm the date, the location, and everything else. Dates and locations are confirmed upon booking.",
    },
    {
      title: "Your session",
      detail:
        "Thirty minutes outdoors. Come as you are — the direction is easy, and the goal is photographs that look like you on a good day.",
    },
    {
      title: "Your gallery",
      detail:
        "Up to 25 professionally edited photographs arrive in an online gallery for viewing and downloading. Additional images are available for purchase.",
    },
  ],

  /* Slots are intentionally sourceless until the studio's own fall frames
     exist. Each renders as a composed seasonal panel in the meantime — the
     layout is complete either way. To fill one: drop the file in
     /public/img/campaigns/fall-mini-sessions/ and set `src` here. Keep the
     alt text describing the real photograph once it lands. */
  galleryTitle: "The look",
  galleryLede:
    "Warm, natural, unfussy. Shot outdoors in the season's own light rather than lit to death in a studio.",
  gallery: [
    { alt: "Fall mini session photograph", caption: "Golden hour, outdoors" },
    { alt: "Fall mini session photograph", caption: "Families, unposed" },
    { alt: "Fall mini session photograph", caption: "Couples in autumn colour" },
    { alt: "Fall mini session photograph", caption: "Kids, between the poses" },
    { alt: "Fall mini session photograph", caption: "Portraits with a season behind them" },
  ],

  ctaLabel: "Message Me to Book Your Session",

  formTitle: "Request your session",
  formLede:
    "Tell us the date you have in mind and what you're hoping for. We'll come back to you to confirm the date, location, and details.",
  dateLabel: "Preferred date",
  sessionTypes: [
    { value: "family", label: "Family" },
    { value: "couple", label: "Couple" },
    { value: "kids", label: "Kids" },
    { value: "portrait", label: "Portrait" },
    { value: "other", label: "Other" },
  ],
  ideasLabel: "Inspiration / ideas",
  ideasPlaceholder:
    "Who's in the photos, what you're hoping for, colours or images you love — anything helps.",

  confirmationTitle: "Your request is in 🍂",
  confirmationBody:
    "Thank you — we've received your Fall Mini Session request and sent a confirmation to your email. Gray Content Studio will contact you soon to confirm the date, location, and details.",

  closingTitle: "Limited spots available this fall.",
  closingLede:
    "Send your request and we'll be in touch to confirm the date, the location, and everything else.",

  emailSubject: "We received your Fall Mini Session request 🍂",
  emailIntro:
    "Thank you for reaching out about a Fall Mini Session — your request has been received.",
  emailNextSteps:
    "Gray Content Studio will contact you soon to confirm the date, location, and details of your session. Nothing is booked until we've confirmed it with you, so there's nothing you need to do in the meantime.",

  metaTitle: "Fall Mini Sessions — $150",
  metaDescription:
    "Fall Mini Sessions from Gray Content Studio — $150 for a 30-minute outdoor session and up to 25 professionally edited digital photos. For couples, families, portraits and kids. Limited spots available this fall.",
};

/** Every campaign the app knows about, published or not. */
export const CAMPAIGNS: Campaign[] = [FALL_MINI_SESSIONS];

export function campaignBySlug(slug: string): Campaign | null {
  return CAMPAIGNS.find((c) => c.slug === slug) ?? null;
}
