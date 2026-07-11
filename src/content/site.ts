/* ============================================================
   SITE CONTENT — EDIT ME
   Services, process, industries, testimonials, packages, FAQ.
   Testimonials marked `placeholder: true` should be replaced
   with real client quotes before launch marketing pushes.
   ============================================================ */

export const CLIENTS = [
  "ExxonMobil",
  "Anthem",
  "Dominion Energy",
  "iHeartRadio",
  "LL Flooring",
  "1MD Nutrition",
  "Hair La Vie",
  "VPAP",
  "Essential Elements",
  "Gigantic",
  "CCWA",
  "Visit Tappahannock",
];

export const SERVICES = [
  {
    title: "Commercial Production",
    outcome: "TV and digital spots that sell — from a 30-second broadcast commercial to platform-native ad creative.",
  },
  {
    title: "Brand Films",
    outcome: "The story of your company, told cinematically — the video that makes prospects choose you before the first call.",
  },
  {
    title: "Photography",
    outcome: "Headshots, products, events, and real estate — imagery consistent with your brand across every channel.",
  },
  {
    title: "Drone Services",
    outcome: "Licensed aerial and FPV cinematography that gives properties, venues, and campaigns undeniable production value.",
  },
  {
    title: "Editing & Post-Production",
    outcome: "A decade of cutting for platforms and audiences — color, sound, and pacing engineered to hold attention.",
  },
  {
    title: "Motion Graphics & Animation",
    outcome: "2D animation and kinetic graphics that make complex ideas land in seconds.",
  },
  {
    title: "Podcast Production",
    outcome: "Network-grade podcast editing — the same pipeline trusted for daily celebrity shows at iHeartRadio.",
  },
  {
    title: "Monthly Content Packages",
    outcome: "A always-on content engine: reels, shorts, and social video delivered on a monthly cadence.",
  },
];

export const PROCESS_STEPS = [
  {
    title: "Discovery",
    text: "A conversation about your business, audience, and goals — what success actually looks like for you.",
  },
  {
    title: "Strategy",
    text: "We translate goals into a creative plan: concepts, platforms, formats, and a measurable definition of done.",
  },
  {
    title: "Pre-Production",
    text: "Scripts, storyboards, locations, talent, permits, and schedules — everything locked before a camera rolls.",
  },
  {
    title: "Production",
    text: "Broadcast-grade cameras, lighting, audio, and direction — on location or in studio.",
  },
  {
    title: "Editing",
    text: "The cut, color, sound design, and graphics that turn footage into a finished story.",
  },
  {
    title: "Delivery",
    text: "Review, revisions, and final masters in every format you need — 4K, vertical, captioned, platform-ready.",
  },
  {
    title: "Content Distribution",
    text: "Versioning and optimization for the channels where your audience actually watches.",
  },
];

export type Industry = {
  slug: string;
  name: string;
  headline: string;
  pain: string;
  approach: string;
  services: string[];
};

export const INDUSTRIES: Industry[] = [
  {
    slug: "contractors",
    name: "Contractors & Home Services",
    headline: "Turn finished jobs into your best salesperson",
    pain: "Your best marketing asset — the quality of your work — disappears the day you hand over the keys. Word of mouth doesn't scale.",
    approach: "Before/after project films, customer testimonial videos, and drone footage that make your craftsmanship impossible to scroll past. One shoot per job site becomes a month of proof-of-work content.",
    services: ["Project showcase films", "Customer testimonials", "Drone footage", "Monthly social content"],
  },
  {
    slug: "restaurants",
    name: "Restaurants & Hospitality",
    headline: "Make them hungry before they arrive",
    pain: "Diners decide with their eyes — on Instagram, TikTok, and Google — hours before they choose a table.",
    approach: "Signature-dish films, kitchen culture stories, and short-form social content shot to make food look the way it tastes. Content calendars timed to menus, seasons, and events.",
    services: ["Food & menu films", "Short-form social reels", "Chef and story features", "Event coverage"],
  },
  {
    slug: "medical",
    name: "Medical & Healthcare",
    headline: "Build patient trust before the first appointment",
    pain: "Patients choose providers they feel they already know. Stock photos and text pages don't build that trust.",
    approach: "Provider introduction videos, patient journey stories, and procedure explainers — produced with the compliance discipline we bring to national health-insurance clients like Anthem.",
    services: ["Provider intro videos", "Patient testimonials", "Procedure explainers", "Practice brand films"],
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    headline: "Listings that sell themselves",
    pain: "Every listing competes with hundreds of others on the same portals. Photos alone no longer clear the bar buyers expect.",
    approach: "Cinematic property tours, licensed drone aerials, agent brand films, and vertical reels for social — the full package that wins listings appointments, not just views.",
    services: ["Property tour films", "Drone aerials & FPV", "Agent brand videos", "Real estate photography"],
  },
  {
    slug: "automotive",
    name: "Automotive",
    headline: "Inventory that moves because people saw it move",
    pain: "Static inventory photos can't communicate what makes a vehicle — or a dealership — worth the drive.",
    approach: "Vehicle walkaround films, dealership brand videos, promotion spots, and social-first reels that put buyers in the driver's seat before they arrive.",
    services: ["Vehicle showcase videos", "Dealership brand films", "Promo commercials", "Social content packages"],
  },
  {
    slug: "gyms",
    name: "Gyms & Fitness",
    headline: "Sell the transformation, not the treadmill",
    pain: "Memberships are sold on identity and community — things a facility photo tour can't show.",
    approach: "Member transformation stories, coach features, class-energy reels, and challenge campaign content that make joining feel inevitable.",
    services: ["Transformation stories", "Coach & community features", "Class highlight reels", "Challenge campaigns"],
  },
  {
    slug: "saas",
    name: "SaaS & Technology",
    headline: "Explain the product in the time it takes to lose them",
    pain: "You have seconds to communicate what your product does and why it matters — before the visitor bounces to a competitor's demo.",
    approach: "Product demo videos, animated explainers, founder story films, and customer case-study videos — the same clarity we brought to Web3 and AI education content for Gigantic.",
    services: ["Product demos", "Animated explainers", "Founder stories", "Customer case studies"],
  },
  {
    slug: "ecommerce",
    name: "E-commerce & DTC",
    headline: "Creative engineered around the first three seconds",
    pain: "Paid social performance lives and dies on creative. Ad fatigue burns through static assets in days.",
    approach: "Conversion-focused product videos, UGC-style testimonials, and platform-native ad variants — the playbook behind campaigns for 1MD Nutrition, Hair La Vie, and Essential Elements.",
    services: ["Product & demo videos", "Testimonial ads", "PPC creative variants", "Amazon content"],
  },
];

export type Testimonial = {
  quote: string;
  author: string;
  role: string;
  rating: number;
  placeholder?: boolean;
};

/* Replace these with real client quotes — each is marked placeholder. */
export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Every deadline hit, every cut better than we imagined. Gray Content Studio runs like a much bigger shop. [PLACEHOLDER — replace with a real quote]",
    author: "Client Name",
    role: "Marketing Director, Corporate Client",
    rating: 5,
    placeholder: true,
  },
  {
    quote:
      "They took a complicated message and made people actually watch it. Our team keeps coming back. [PLACEHOLDER — replace with a real quote]",
    author: "Client Name",
    role: "Communications Lead, Nonprofit",
    rating: 5,
    placeholder: true,
  },
  {
    quote:
      "The campaign creative outperformed everything we'd run before. Worth every dollar. [PLACEHOLDER — replace with a real quote]",
    author: "Client Name",
    role: "Founder, E-commerce Brand",
    rating: 5,
    placeholder: true,
  },
];

export type Package = {
  name: string;
  price: string;
  tagline: string;
  includes: string[];
  note: string;
};

/* Package examples guide visitors into the calculator — prices assembled from the real rate card. */
export const PACKAGES: Package[] = [
  {
    name: "Social Starter",
    price: "from $1,400",
    tagline: "A month of scroll-stopping short-form content.",
    includes: [
      "Half-day videography shoot",
      "4 platform-native reels or shorts",
      "Captions + vertical versions",
      "Thumbnail design",
    ],
    note: "Ideal for restaurants, gyms, and local brands building presence.",
  },
  {
    name: "Brand Builder",
    price: "from $3,800",
    tagline: "The film that defines how customers see you.",
    includes: [
      "Brand story video (2–3 min)",
      "Full-day production with lighting & audio",
      "Advanced editing, color grade, motion graphics",
      "Cutdowns for social + 4K masters",
    ],
    note: "Ideal for companies ready to look like the market leader.",
  },
  {
    name: "Campaign Engine",
    price: "from $6,500",
    tagline: "A full commercial campaign, concept to distribution.",
    includes: [
      "30–60 sec commercial",
      "Creative strategy + script + storyboard",
      "Multi-day production incl. drone",
      "Platform variants, testimonial cutdowns, ad versions",
    ],
    note: "Ideal for product launches, seasonal pushes, and paid media.",
  },
];

export type Faq = { q: string; a: string; category: string };

export const FAQS: Faq[] = [
  {
    q: "How much does a video project cost?",
    a: "Projects are quoted from a transparent rate card — most social content packages start around $1,400/month, brand films around $3,800, and full commercial campaigns from $6,500. Use the pricing calculator on our Pricing page to build a real-time estimate for your exact scope, or submit an inquiry for a custom quote within one business day.",
    category: "Pricing",
  },
  {
    q: "How long does production take?",
    a: "A typical social content package delivers within 1–2 weeks of the shoot. Brand films run 3–4 weeks including revisions. Commercials with full pre-production typically take 4–6 weeks. Rush delivery (48-hour) and same-day options are available for time-sensitive work.",
    category: "Process",
  },
  {
    q: "What happens after I submit an inquiry?",
    a: "You'll get a personal reply within one business day. We'll schedule a short discovery call to understand your goals, then send a written proposal with scope, timeline, and pricing. A deposit books your production dates; the balance is due on delivery.",
    category: "Process",
  },
  {
    q: "How many revisions are included?",
    a: "Every project includes a revision round after the first cut. Additional revision rounds are available at a flat rate ($75/round) so scope stays predictable for both of us.",
    category: "Process",
  },
  {
    q: "Do you travel for shoots?",
    a: "Yes. The first 25 round-trip miles are always free, then travel bills at $0.75/mile. Overnight travel is available for multi-day or distant productions.",
    category: "Logistics",
  },
  {
    q: "Who owns the final videos?",
    a: "You do. Final deliverables are yours to use across your channels. Raw footage delivery and long-term project archiving are available as add-ons if you want everything.",
    category: "Logistics",
  },
  {
    q: "What industries do you work with?",
    a: "Our portfolio spans Fortune 500 corporate (ExxonMobil, Anthem, Dominion Energy), media (iHeartRadio), political campaigns, nonprofits, e-commerce, real estate, and more. We build industry-specific approaches — see our Industries pages for how we work in yours.",
    category: "Studio",
  },
  {
    q: "Do you handle social media posting too?",
    a: "We offer social media management services — strategy, scheduling, uploads, community management, and analytics reporting — as monthly add-ons to content packages.",
    category: "Studio",
  },
  {
    q: "Can you produce podcasts?",
    a: "Yes — podcast editing is a core service. Our editor has cut daily and overnight celebrity podcasts for iHeartRadio, including shows distributed on Spotify, Apple Music, and Amazon.",
    category: "Studio",
  },
  {
    q: "What equipment do you use?",
    a: "Broadcast-grade cameras, professional lighting and audio packages, gimbals, teleprompters, and licensed drone operation (including FPV). Post-production runs on Premiere Pro, After Effects, and DaVinci Resolve Studio.",
    category: "Studio",
  },
];

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  readMinutes: number;
  paragraphs: string[];
};

/* Seed articles — replace or extend anytime. Each renders at /blog/[slug]. */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-much-does-video-production-cost",
    title: "How Much Does Video Production Actually Cost in 2026?",
    description:
      "A transparent breakdown of what goes into video production pricing — and how to budget for content that pays for itself.",
    date: "2026-06-15",
    category: "Pricing",
    readMinutes: 6,
    paragraphs: [
      "Ask ten production companies what a video costs and you'll get ten answers — usually after three discovery calls. We think that's backwards. Here's how video pricing actually works, using our own public rate card as the example.",
      "Every video project has four cost layers: pre-production (strategy, scripts, storyboards), production (crew, equipment, locations), post-production (editing, color, sound, graphics), and delivery (formats, captions, platform versions). A 'cheap' quote usually means one of these layers is missing — and you'll feel it in the final cut.",
      "For reference: a professional half-day shoot runs around $500, full-day $900. Advanced editing bills around $125/hour. A finished 30–60 second commercial, all layers included, typically lands between $1,500 and $6,500 depending on concept complexity. Monthly social content packages start around $1,400.",
      "The real question isn't 'what does video cost' — it's 'what does the video need to do?' A brand film that wins you two enterprise contracts pays for itself hundreds of times over. A reel that dies with 200 views was expensive at any price. Start with the business outcome, and the budget conversation gets easy.",
      "Want a real number for your project? Our pricing calculator uses our actual rate card — no email gate, no sales call required.",
    ],
  },
  {
    slug: "why-every-business-needs-a-brand-film",
    title: "Why Every Business Needs a Brand Film (Not Just Ads)",
    description:
      "Ads interrupt. Brand films convince. Here's why the story video on your homepage may be the highest-leverage marketing asset you own.",
    date: "2026-05-20",
    category: "Strategy",
    readMinutes: 5,
    paragraphs: [
      "Your prospects research you before they ever talk to you. By the time someone books a call, they've seen your website, your socials, and your reviews. The question is what impression that research left — and nothing shapes it faster than a brand film.",
      "A brand film is the two-to-three minute video that answers the questions every buyer silently asks: Who are these people? Do they understand my problem? Can I trust them with my money? Text can claim; film demonstrates.",
      "The math favors film, too. A brand film lives on your homepage, plays in your sales deck, opens your webinars, runs as pre-roll, and cuts down into a dozen social clips. One production, years of use, every channel.",
      "The businesses that benefit most are the ones who think they're 'not visual' — contractors, B2B services, medical practices. When nobody in your category is telling their story well, the first one who does owns the market's attention.",
    ],
  },
  {
    slug: "short-form-video-strategy-2026",
    title: "The Short-Form Video Strategy That Actually Works",
    description:
      "Reels, Shorts, and TikTok reward consistency over virality. Here's the production system that keeps brands posting without burning out.",
    date: "2026-04-10",
    category: "Social Media",
    readMinutes: 5,
    paragraphs: [
      "Every brand knows it should be posting short-form video. Most last three weeks. The problem isn't ideas — it's production burnout: shooting, editing, captioning, and posting is a part-time job nobody was hired for.",
      "The fix is batching. One well-planned half-day shoot yields 8–12 pieces of short-form content when it's shot with the edit in mind: multiple setups, varied framings, hooks captured deliberately rather than hoped for in the edit.",
      "Platform-native beats cross-posted. A vertical edit with burned-in captions, a 1.5-second hook, and platform-specific pacing consistently outperforms the same footage exported once and blasted everywhere. The extra edit cost is small; the reach difference isn't.",
      "Consistency compounds. The algorithm rewards accounts that post reliably, and audiences trust brands they see weekly. That's why we structure short-form as monthly packages rather than one-off projects — the tenth week of consistent posting is where the results live.",
    ],
  },
];

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getIndustry(slug: string) {
  return INDUSTRIES.find((i) => i.slug === slug);
}
